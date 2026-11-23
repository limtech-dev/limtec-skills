#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
力姆泰克《选型方案书》 · Word(.docx) → PDF 版式还原渲染器

用法:
  python3 scripts/report.py 方案书.docx 方案书.pdf
  python3 scripts/report.py --selftest          # 先调 make_docx.js --demo 再转 PDF
  python3 scripts/report.py --plain 方案书.docx 方案书.pdf   # 不加水印/版权页脚

设计要点：
  旧版把版面「摆」出来（固定 1.3 倍行距、全表加网格线、标签用宋体），
  与 Word 实际样式必然对不上。本版改为**读 OOXML 样式还原**：
    · 字体按文档声明（Arial → Helvetica 度量一致；中文 黑体系 TTF，缺失回退 CID 宋体）
    · 行距按 w:spacing（auto = 倍数 / exact / atLeast）而不是写死 1.3
    · 表格线按 w:tblBorders / w:tcBorders（nil 就是没有线，不再全表打网格）
    · 段落边框 w:pBdr（页眉横线、章节标题下的蓝线）真正画出来
    · w:caps 小标题转大写、w:shd 段落底纹（顶部色条）、rPr/w:spacing 字间距
    · 页眉页脚按 w:tabs 的对齐制表位定位，页码域取真实页数
环境变量:
  LIMTEC_WATERMARK / LIMTEC_COPYRIGHT / LIMTEC_PDF_TITLE / LIMTEC_PDF_AUTHOR
  LIMTEC_PDF_LATIN（默认 Helvetica） / LIMTEC_PDF_CJK（song = CID 宋体）
"""
import io
import os
import re
import shutil
import struct
import subprocess
import sys
import zipfile
import zlib
import xml.etree.ElementTree as ET

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.pdfbase import pdfmetrics, pdfutils
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import BaseDocTemplate, Flowable, Frame, PageTemplate, PageBreak, Table, TableStyle

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'

TWIP = 1.0 / 20.0          # twips → pt
EMU = 1.0 / 12700.0        # EMU → pt

WATERMARK = os.environ.get('LIMTEC_WATERMARK', '力姆泰克 Lim-Tec')
COPYRIGHT = os.environ.get('LIMTEC_COPYRIGHT', '版权归 力姆泰克（北京）传动设备股份有限公司 所有')
PLAIN = False              #

CJK_RE = re.compile(u'[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]')

#
TRACE_PATH = os.environ.get('LIMTEC_PDF_TRACE')
TRACE = []


def trace(c, x, y, text, kind='text'):
    if TRACE_PATH:
        try:
            ax, ay = c.absolutePosition(x, y)
        except Exception:
            ax, ay = x, y
        TRACE.append((c.getPageNumber(), round(ax, 1), round(ay, 1), kind, text[:120]))


def trace_flush():
    if TRACE_PATH:
        with open(TRACE_PATH, 'w', encoding='utf-8') as f:
            for row in TRACE:
                f.write('%d\t%.1f\t%.1f\t%s\t%s\n' % row)

#
#
#
#
#
LH_LATIN = 1.150
LH_CJK = 1.300

LATIN = 'Helvetica'
LATIN_B = 'Helvetica-Bold'
CJK = 'STSong-Light'
CJK_B = None

CJK_TTF_CANDIDATES = [
    ('/system/fonts/FZHeiT-SC-Regular.ttf', '/system/fonts/FZHeiT-SC-Bold.ttf'),
    ('/system/fonts/HarmonyOS_Sans_SC.ttf', None),
    ('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', None),
    ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', None),
    ('/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', None),
    ('/System/Library/Fonts/PingFang.ttc', None),
    ('/System/Library/Fonts/Supplemental/Songti.ttc', None),
    ('C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/msyhbd.ttc'),
]


def init_fonts():
    """按环境与系统字体确定中西文字体；找不到 TTF 时退回 reportlab 自带 CID 宋体。"""
    global LATIN, LATIN_B, CJK, CJK_B
    LATIN = os.environ.get('LIMTEC_PDF_LATIN', 'Helvetica')
    LATIN_B = 'Helvetica-Bold'
    if LATIN != 'Helvetica':
        for f, b in ((LATIN, LATIN), (LATIN, None)):
            pass
    want = (os.environ.get('LIMTEC_PDF_CJK') or '').strip()
    if want.lower() in ('song', 'stsong', 'cid'):
        pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
        CJK, CJK_B = 'STSong-Light', 'STSong-Light'
        return
    pairs = [(want, None)] if want else []
    pairs += CJK_TTF_CANDIDATES
    for reg, bold in pairs:
        if not reg or not os.path.exists(reg):
            continue
        try:
            name = 'LT-CJK'
            pdfmetrics.registerFont(TTFont(name, reg, subfontIndex=0))
            CJK = name
            CJK_B = name
            if bold and os.path.exists(bold):
                pdfmetrics.registerFont(TTFont(name + '-B', bold, subfontIndex=0))
                CJK_B = name + '-B'
            return
        except Exception:
            continue
    pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
    CJK, CJK_B = 'STSong-Light', 'STSong-Light'


def face(bold, cjk):
    if cjk:
        return (CJK_B or CJK) if bold else CJK
    return LATIN_B if bold else LATIN


def sw(text, font, size, cs=0.0):
    if not text:
        return 0.0
    return pdfmetrics.stringWidth(text, font, size) + cs * len(text)


def ascent_of(font, size):
    return pdfmetrics.getAscent(font, size)


def descent_of(font, size):
    return -pdfmetrics.getDescent(font, size)


#
def tag(el):
    return el.tag.replace('{%s}' % W, '') if isinstance(el.tag, str) else ''


def attr(el, name, default=None):
    if el is None:
        return default
    v = el.get('{%s}%s' % (W, name))
    return default if v is None else v


def child(el, name):
    return None if el is None else el.find('{%s}%s' % (W, name))


def kids(el, name):
    return [] if el is None else el.findall('{%s}%s' % (W, name))


def num(v, default=0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


#
def decode_png(data):
    """最小 PNG 解码器：8-bit、非隔行、color type 0/2/3/4/6"""
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    p = 8
    idat = b''
    plte = trns = None
    w = h = ct = None
    while p + 8 <= len(data):
        ln, typ = struct.unpack('>I4s', data[p:p + 8])
        p += 8
        chunk = data[p:p + ln]
        p += ln + 4
        if typ == b'IHDR':
            w, h, bitd, ct, comp, filt, inter = struct.unpack('>IIBBBBB', chunk)
            if bitd != 8 or inter != 0:
                raise ValueError('unsupported PNG bitd=%d inter=%d' % (bitd, inter))
        elif typ == b'IDAT':
            idat += chunk
        elif typ == b'PLTE':
            plte = chunk
        elif typ == b'tRNS':
            trns = chunk
        elif typ == b'IEND':
            break
    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    stride = w * nch
    raw = zlib.decompress(idat)
    img = bytearray(stride * h)
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        f = raw[pos]
        pos += 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride
        if f == 1:
            for i in range(nch, stride):
                line[i] = (line[i] + line[i - nch]) & 0xFF
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif f == 3:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif f == 4:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                b = prev[i]
                c = prev[i - nch] if i >= nch else 0
                pp = a + b - c
                pa, pb, pc = abs(pp - a), abs(pp - b), abs(pp - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        img[y * stride:(y + 1) * stride] = line
        prev = line
    rgb = bytearray(w * h * 3)
    alpha = None
    if ct == 2:
        rgb = img
    elif ct == 6:
        alpha = bytearray(w * h)
        k = 0
        for i in range(0, len(img), 4):
            rgb[k:k + 3] = img[i:i + 3]
            alpha[k // 3] = img[i + 3]
            k += 3
    elif ct == 0:
        for i in range(w * h):
            rgb[i * 3:i * 3 + 3] = bytes([img[i]]) * 3
    elif ct == 4:
        alpha = bytearray(w * h)
        k = 0
        for i in range(0, len(img), 2):
            g = img[i]
            rgb[k:k + 3] = bytes([g]) * 3
            alpha[k // 3] = img[i + 1]
            k += 3
    elif ct == 3:
        for i in range(w * h):
            idx = img[i] * 3
            rgb[i * 3:i * 3 + 3] = plte[idx:idx + 3]
            if trns and idx // 3 < len(trns) and trns[idx // 3]:
                if alpha is None:
                    alpha = bytearray(w * h)
                alpha[i] = trns[idx // 3]
    return w, h, bytes(rgb), (bytes(alpha) if alpha else None)


class JpegImg(object):
    """JPEG 原样直通（PDF /DCTDecode），无需 PIL 解码，画质与体积都最优。"""
    mode = 'RGB'

    def __init__(self, data, w, h):
        self._data, self._w, self._h = data, w, h

    def getSize(self):
        return (self._w, self._h)

    def jpeg_fh(self):
        return io.BytesIO(self._data)


class RawImgGray(object):
    mode = 'L'

    def __init__(self, w, h, alpha):
        self._w, self._h, self._a = w, h, alpha

    def getSize(self):
        return (self._w, self._h)

    def getRGBData(self):
        return self._a

    def getTransparent(self):
        return None

    def jpeg_fh(self):
        return None


class RawImg(object):
    mode = 'RGB'

    def __init__(self, w, h, rgb, alpha=None):
        self._w, self._h, self._rgb = w, h, rgb
        self._dataA = RawImgGray(w, h, alpha) if alpha else None

    def getSize(self):
        return (self._w, self._h)

    def getRGBData(self):
        return self._rgb

    def getTransparent(self):
        return None

    def jpeg_fh(self):
        return None


#
class Pic(Flowable):
    """内联图片（无 PIL 环境：走 RawImg + drawImage）"""

    def __init__(self, obj, w, h, align='left'):
        Flowable.__init__(self)
        self._obj, self.width, self.height = obj, w, h
        self.align = align
        self.hAlign = {'center': 'CENTER', 'right': 'RIGHT'}.get(align, 'LEFT')

    def wrap(self, aw, ah):
        return (self.width, self.height)

    def draw(self):
        trace(self.canv, 0, 0, 'IMG %.0fx%.0f' % (self.width, self.height), 'img')
        kw = {}
        if not isinstance(self._obj, JpegImg):
            kw['mask'] = 'auto'
        self.canv.drawImage(self._obj, 0, 0, width=self.width, height=self.height, **kw)


class Para(Flowable):
    """段落：自带断行/对齐/制表位/底纹/边框，按 Word 的行距模型排。"""

    def __init__(self, model, avail):
        Flowable.__init__(self)
        self.m = model
        self.avail = avail
        self.lines = []          # [[(x, base, text, font, size, color, cs)]]
        self._h = 0
        self.cjk = any(CJK_RE.search(r.get('text') or '') for r in self.m['runs'])

    #
    def _leading(self):
        m = self.m
        size = m['size']
        if m['line_rule'] in ('exact', 'atLeast') and m['line']:
            v = m['line']
            if m['line_rule'] == 'exact':
                return v
            return max(v, size * (LH_CJK if self.cjk else LH_LATIN))
        factor = LH_CJK if self.cjk else LH_LATIN
        if m['line']:
            #
            #
            return size * factor * (m['line'] / 12.0)
        return size * factor

    def _atoms(self):
        """把 runs 拆成可排版的原子：('txt', text, font, size, color, cs) / ('tab',) / ('br',)"""
        out = []
        for run in self.m['runs']:
            if run.get('br'):
                out.append(('br',))
                continue
            if run.get('tab'):
                out.append(('tab',))
                continue
            text = run['text']
            if not text:
                continue
            bold, size, color, cs = run['bold'], run['size'], run['color'], run['cs']
            #
            for seg in re.split(u'([\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]+)', text):
                if not seg:
                    continue
                cjk = bool(CJK_RE.search(seg))
                font = face(bold, cjk)
                if cjk:
                    for ch in seg:
                        out.append(('txt', ch, font, size, color, cs))
                else:
                    for word in re.split(r'(\s+)', seg):
                        if not word:
                            continue
                        if word.isspace():
                            out.append(('txt', word, font, size, color, cs))
                            continue
                        #
                        #
                        for part in re.findall(r'[^-/]*[-/]|[^-/]+$', word):
                            out.append(('txt', part, font, size, color, cs))
        return out

    #
    def wrap(self, aw, ah):
        m = self.m
        self.width = aw
        leading = self._leading()
        ind_l = m['ind_left']
        ind_f = m['ind_first']
        base_avail = aw - ind_l
        lines = []
        cur = []
        cur_w = 0.0
        first = True
        avail = base_avail - (ind_f if ind_f > 0 else 0)
        pending_tab_x = None
        for a in self._atoms():
            if a[0] == 'br':
                lines.append((cur, cur_w, first))
                cur, cur_w, first = [], 0.0, False
                avail = base_avail - (ind_f if ind_f < 0 else 0)
                continue
            if a[0] == 'tab':
                pending_tab_x = True
                continue
            w = sw(a[1], a[2], a[3], a[5])
            if cur and cur_w + w > avail + 0.2 and not a[1].isspace():
                lines.append((cur, cur_w, first))
                cur, cur_w, first = [], 0.0, False
                avail = base_avail + (abs(ind_f) if ind_f < 0 else 0)
                if a[1].isspace():
                    continue
            if not cur and a[1].isspace() and lines:
                continue
            cur.append(a)
            cur_w += w
        lines.append((cur, cur_w, first))

        #
        self.lines = []
        align = m['jc']
        for atoms, wsum, is_first in lines:
            x0 = ind_l + (ind_f if (is_first and ind_f > 0) else 0)
            if is_first and ind_f < 0:
                x0 = ind_l + ind_f
            limit = base_avail + (abs(ind_f) if (is_first and ind_f < 0) else 0)
            slack = limit - wsum
            if align == 'center':
                x0 += slack / 2.0
                slack = 0
            elif align == 'right':
                x0 += slack
                slack = 0
            items = []
            x = x0
            if align == 'both' and slack > 0.5:
                nsp = sum(1 for a in atoms if a[1].isspace())
                if nsp:
                    add = slack / nsp
                    for a in atoms:
                        if a[1].isspace():
                            x += add
                        items.append([x, a])
                        x += sw(a[1], a[2], a[3], a[5])
                else:
                    add = slack / max(1, len(atoms) - 1)
                    for i, a in enumerate(atoms):
                        items.append([x, a])
                        x += sw(a[1], a[2], a[3], a[5]) + (add if i < len(atoms) - 1 else 0)
            else:
                for a in atoms:
                    items.append([x, a])
                    x += sw(a[1], a[2], a[3], a[5])
            self.lines.append(items)

        self._h = leading * max(1, len(self.lines))
        return (aw, self._h + m['before'] + m['after'])

    def getSpaceBefore(self):
        return self.m['before']

    def getSpaceAfter(self):
        return self.m['after']

    def draw(self):
        m = self.m
        leading = self._leading()
        c = self.canv
        total_h = self._h
        x_left = m['ind_left']
        #
        if m['shading']:
            c.saveState()
            c.setFillColor(HexColor('#' + m['shading']))
            c.rect(x_left, 0, self.width - x_left, total_h, stroke=0, fill=1)
            trace(c, x_left, 0, 'SHD %s h=%.1f' % (m['shading'], total_h), 'shd')
            c.restoreState()
        #
        for side, (bw, bcolor, space) in m['borders'].items():
            c.saveState()
            c.setStrokeColor(HexColor('#' + bcolor))
            c.setLineWidth(bw)
            if side in ('bottom', 'top'):
                y = (-space) if side == 'bottom' else (total_h + space)
                c.line(x_left, y, self.width, y)
            else:
                x = (x_left - space) if side == 'left' else (self.width + space)
                c.line(x, 0, x, total_h)
            c.restoreState()

        top = total_h
        for items in self.lines:
            first_font = items[0][1][2] if items else LATIN
            first_size = items[0][1][3] if items else m['size']
            asc = ascent_of(first_font, first_size)
            desc = descent_of(first_font, first_size)
            base = top - ((leading - (asc + desc)) / 2.0 + asc)
            last = None
            for x, a in items:
                font, size, color, cs = a[2], a[3], a[4], a[5]
                if last != (font, size):
                    c.setFont(font, size)
                    last = (font, size)
                c.setFillColor(HexColor('#' + color) if color else HexColor('#000000'))
                if cs:
                    to = c.beginText(x, base)
                    to.setFont(font, size)
                    to.setCharSpace(cs)
                    to.textOut(a[1])
                    c.drawText(to)
                else:
                    c.drawString(x, base, a[1])
                trace(c, x, base, a[1])
            top -= leading


class Tbl(object):
    """w:tbl → reportlab Table（逐边读边框，nil 就是无线）"""

    def __init__(self, conv, el):
        self.conv = conv
        self.el = el
        self.flow = None

    def build(self, avail):
        el = self.el
        tblpr = child(el, 'tblPr')
        grid = [num(attr(g, 'w')) * TWIP for g in kids(child(el, 'tblGrid'), 'gridCol')]
        borders = self._borders(child(tblpr, 'tblBorders'))
        cellmar = {'top': 0.0, 'bottom': 0.0, 'left': 5.4, 'right': 5.4}
        cm = child(tblpr, 'tblCellMar')
        if cm is not None:
            for side in ('top', 'bottom', 'left', 'right'):
                s = child(cm, side)
                if s is not None:
                    cellmar[side] = num(attr(s, 'w'), 0) * TWIP
        data, spans, style = [], [], []
        vstart = {}
        rows = kids(el, 'tr')
        for ri, tr in enumerate(rows):
            cells = []
            ci = 0
            for tc in kids(tr, 'tc'):
                tcpr = child(tc, 'tcPr')
                span = int(num(attr(child(tcpr, 'gridSpan'), 'val'), 1) or 1)
                vmerge_el = child(tcpr, 'vMerge')
                vmerge = (attr(vmerge_el, 'val', 'continue') if vmerge_el is not None else None)
                fill = attr(child(tcpr, 'shd'), 'fill')
                valign = attr(child(tcpr, 'vAlign'), 'val', 'top')
                if vmerge == 'continue':
                    cells.append('')
                    vstart.setdefault(ci, ri)
                    ci += span
                    continue
                if vmerge == 'restart':
                    vstart[ci] = ri
                flows = []
                for node in tc:
                    if tag(node) == 'p':
                        p = self.conv.para_model(node)
                        if p.get('pic'):
                            flows.append(Pic(p['pic'][0], p['pic'][1], p['pic'][2], p['jc']))
                            continue
                        if not p['runs'] and not p['shading'] and not p['borders']:
                            continue
                        flows.append(Para(p, 0))
                    elif tag(node) == 'tbl':
                        sub = Tbl(self.conv, node).build(0)
                        if sub is not None:
                            flows.append(sub)
                cells.append(flows if flows else [Para(self.conv.empty_model(), 0)])
                if span > 1:
                    spans.append((ri, ci, span))
                #
                if fill and fill != 'auto':
                    style.append(('BACKGROUND', (ci, ri), (ci + span - 1, ri), HexColor('#' + fill)))
                if valign in ('center', 'bottom'):
                    style.append(('VALIGN', (ci, ri), (ci + span - 1, ri),
                                  'MIDDLE' if valign == 'center' else 'BOTTOM'))
                cb = self._borders(child(tcpr, 'tcBorders'))
                for side, spec in cb.items():
                    if spec is None:
                        continue
                    bw, bcolor = spec
                    if side == 'top':
                        style.append(('LINEABOVE', (ci, ri), (ci + span - 1, ri), bw, HexColor('#' + bcolor)))
                    elif side == 'bottom':
                        style.append(('LINEBELOW', (ci, ri), (ci + span - 1, ri), bw, HexColor('#' + bcolor)))
                    elif side == 'left':
                        style.append(('LINEBEFORE', (ci, ri), (ci, ri), bw, HexColor('#' + bcolor)))
                    elif side == 'right':
                        style.append(('LINEAFTER', (ci + span - 1, ri), (ci + span - 1, ri), bw, HexColor('#' + bcolor)))
                ci += span
            data.append(cells)

        nrows = len(data)
        ncols = len(grid) or max((len(r) for r in data), default=1)
        widths = list(grid) + [80.0] * max(0, ncols - len(grid))
        tot = sum(widths)
        if avail and tot > avail:
            widths = [w0 * avail / tot for w0 in widths]
        norm = []
        for r0 in data:
            r0 = list(r0)
            while len(r0) < ncols:
                r0.append('')
            norm.append(r0[:ncols])

        style.extend([
            ('LEFTPADDING', (0, 0), (-1, -1), cellmar['left']),
            ('RIGHTPADDING', (0, 0), (-1, -1), cellmar['right']),
            ('TOPPADDING', (0, 0), (-1, -1), cellmar['top']),
            ('BOTTOMPADDING', (0, 0), (-1, -1), cellmar['bottom']),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ])
        #
        for side, spec in borders.items():
            if spec is None:
                continue
            bw, bcolor = spec
            col = HexColor('#' + bcolor)
            if side == 'top':
                style.append(('LINEABOVE', (0, 0), (-1, 0), bw, col))
            elif side == 'bottom':
                style.append(('LINEBELOW', (0, nrows - 1), (-1, nrows - 1), bw, col))
            elif side == 'left':
                style.append(('LINEBEFORE', (0, 0), (0, -1), bw, col))
            elif side == 'right':
                style.append(('LINEAFTER', (-1, 0), (-1, -1), bw, col))
            elif side == 'insideH':
                for r in range(nrows - 1):
                    style.append(('LINEBELOW', (0, r), (-1, r), bw, col))
            elif side == 'insideV':
                for c0 in range(ncols - 1):
                    style.append(('LINEAFTER', (c0, 0), (c0, -1), bw, col))

        for ri, ci, span in spans:
            style.append(('SPAN', (ci, ri), (ci + span - 1, ri)))
        for ci, r0 in list(vstart.items()):
            rows_idx = [r for r in range(r0 + 1, nrows) if ci < len(norm[r]) and norm[r][ci] == '']
            end = r0
            for r in rows_idx:
                if r != end + 1:
                    break
                end = r
            if end > r0:
                style.append(('SPAN', (ci, r0), (ci, end)))

        t = Table(norm, colWidths=widths, hAlign='LEFT')
        t.setStyle(TableStyle(style))
        self.flow = t
        return t

    @staticmethod
    def _borders(el):
        """{side: (bw, color)} / {side: None}（nil 显式无线）"""
        out = {}
        if el is None:
            return out
        for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
            s = child(el, side)
            if s is None:
                continue
            val = attr(s, 'val', 'single')
            if val in ('nil', 'none'):
                out[side] = None
            else:
                sz = num(attr(s, 'sz'), 4)
                out[side] = (max(0.4, sz / 8.0), attr(s, 'color', '000000') or '000000')
        return out


#
class Converter(object):
    def __init__(self, docx_path):
        self.z = zipfile.ZipFile(docx_path)
        self.doc = ET.fromstring(self.z.read('word/document.xml'))
        self.rels = {}
        try:
            for rel in ET.fromstring(self.z.read('word/_rels/document.xml.rels')):
                self.rels[rel.get('Id')] = rel.get('Target')
        except KeyError:
            pass
        self._img = {}
        self.default_size = 10.0
        self.default_color = None
        st = None
        try:
            st = ET.fromstring(self.z.read('word/styles.xml'))
        except KeyError:
            pass
        if st is not None:
            dd = child(st, 'docDefaults')
            rpr = child(child(dd, 'rPrDefault'), 'rPr')
            sz = child(rpr, 'sz')
            if sz is not None:
                self.default_size = num(attr(sz, 'val'), 20) / 2.0
            ppr = child(child(dd, 'pPrDefault'), 'pPr')
            self.default_spacing = self._spacing(ppr)
        else:
            self.default_spacing = (0.0, 0.0, None, 'auto')
        self.sect = {'w': 11906 * TWIP, 'h': 16838 * TWIP,
                     'ml': 1020 * TWIP, 'mr': 1020 * TWIP,
                     'mt': 900 * TWIP, 'mb': 820 * TWIP,
                     'header': 480 * TWIP, 'footer': 460 * TWIP,
                     'header_part': None, 'footer_part': None}

    #
    def image(self, rid):
        if rid in self._img:
            return self._img[rid]
        obj = None
        target = self.rels.get(rid)
        if target:
            name = target if target.startswith('word/') else ('word/' + target.lstrip('/'))
            try:
                data = self.z.read(name)
                if data[:8] == b'\x89PNG\r\n\x1a\n':
                    w, h, rgb, alpha = decode_png(data)
                    obj = RawImg(w, h, rgb, alpha)
                elif data[:2] == b'\xff\xd8':
                    info = pdfutils.readJPEGInfo(io.BytesIO(data))
                    obj = JpegImg(data, info[0], info[1])
            except (KeyError, ValueError, AssertionError, zlib.error):
                obj = None
        self._img[rid] = obj
        return obj

    #
    def read_sect(self, el):
        s = self.sect
        for ch in el:
            t = tag(ch)
            if t == 'pgSz':
                s['w'] = num(attr(ch, 'w'), 11906) * TWIP
                s['h'] = num(attr(ch, 'h'), 16838) * TWIP
            elif t == 'pgMar':
                for k, key in (('top', 'mt'), ('bottom', 'mb'), ('left', 'ml'),
                               ('right', 'mr'), ('header', 'header'), ('footer', 'footer')):
                    if attr(ch, k) is not None:
                        s[key] = num(attr(ch, k)) * TWIP
                if attr(ch, 'gutter'):
                    s['ml'] += num(attr(ch, 'gutter')) * TWIP
            elif t == 'headerReference':
                if not s['header_part']:
                    s['header_part'] = ch.get('{%s}id' % R)
            elif t == 'footerReference':
                if not s['footer_part']:
                    s['footer_part'] = ch.get('{%s}id' % R)

    def _spacing(self, ppr):
        before = after = 0.0
        line = None
        rule = 'auto'
        sp = child(ppr, 'spacing')
        if sp is not None:
            before = num(attr(sp, 'before'), 0) * TWIP
            after = num(attr(sp, 'after'), 0) * TWIP
            if attr(sp, 'line') is not None:
                line = num(attr(sp, 'line')) * TWIP
            rule = attr(sp, 'lineRule', 'auto')
        return (before, after, line, rule)

    #
    def empty_model(self):
        return {'runs': [], 'jc': 'left', 'before': 0.0, 'after': 0.0, 'line': None,
                'line_rule': 'auto', 'ind_left': 0.0, 'ind_first': 0.0,
                'shading': None, 'borders': {}, 'size': self.default_size, 'pic': None}

    def para_model(self, p):
        m = self.empty_model()
        ppr = child(p, 'pPr')
        m['before'], m['after'], m['line'], m['line_rule'] = self.default_spacing
        if ppr is not None:
            jc = attr(child(ppr, 'jc'), 'val')
            if jc:
                m['jc'] = {'both': 'both', 'center': 'center', 'right': 'right',
                           'distribute': 'both'}.get(jc, 'left')
            if child(ppr, 'spacing') is not None:
                m['before'], m['after'], m['line'], m['line_rule'] = self._spacing(ppr)
            ind = child(ppr, 'ind')
            if ind is not None:
                m['ind_left'] = num(attr(ind, 'left', attr(ind, 'start')), 0) * TWIP
                fl = attr(ind, 'firstLine')
                hg = attr(ind, 'hanging')
                if fl is not None:
                    m['ind_first'] = num(fl) * TWIP
                elif hg is not None:
                    m['ind_first'] = -num(hg) * TWIP
            shd = child(ppr, 'shd')
            if shd is not None:
                fill = attr(shd, 'fill')
                if fill and fill not in ('auto', 'FFFFFF'):
                    m['shading'] = fill
            pbd = child(ppr, 'pBdr')
            if pbd is not None:
                for side in ('top', 'bottom', 'left', 'right'):
                    s = child(pbd, side)
                    if s is None:
                        continue
                    if attr(s, 'val', 'single') in ('nil', 'none'):
                        continue
                    m['borders'][side] = (max(0.4, num(attr(s, 'sz'), 4) / 8.0),
                                          attr(s, 'color', 'auto') if attr(s, 'color', 'auto') != 'auto' else '000000',
                                          num(attr(s, 'space'), 0) * TWIP)
            pbb = child(ppr, 'pageBreakBefore')
            if pbb is not None and attr(pbb, 'val', '1') not in ('0', 'false'):
                m['page_break_before'] = True

        pics = []
        size0 = self.default_size
        for node in p:
            t = tag(node)
            if t == 'r':
                rpr = child(node, 'rPr')
                if child(rpr, 'vanish') is not None and attr(child(rpr, 'vanish'), 'val', '1') not in ('0', 'false'):
                    continue
                bold = False
                color = None
                size = size0
                cs = 0.0
                caps = False
                if rpr is not None:
                    b = child(rpr, 'b')
                    if b is not None and attr(b, 'val', '1') not in ('0', 'false', 'none'):
                        bold = True
                    c = child(rpr, 'color')
                    if c is not None:
                        v = attr(c, 'val')
                        if v and v != 'auto':
                            color = v.lstrip('#')
                    sz = child(rpr, 'sz')
                    if sz is not None:
                        size = num(attr(sz, 'val'), 20) / 2.0
                    sp = child(rpr, 'spacing')
                    if sp is not None:
                        cs = num(attr(sp, 'val'), 0) * TWIP
                    cp = child(rpr, 'caps')
                    if cp is not None and attr(cp, 'val', '1') not in ('0', 'false'):
                        caps = True
                for rn in node:
                    rt = tag(rn)
                    if rt == 't':
                        txt = (rn.text or '')
                        if caps:
                            txt = txt.upper()
                        m['runs'].append({'text': txt, 'bold': bold, 'size': size,
                                          'color': color, 'cs': cs})
                        size0 = size
                    elif rt == 'br':
                        if rn.get('{%s}type' % W) == 'page':
                            m.setdefault('page_break', 0)
                            m['page_break'] = m.get('page_break', 0) + 1
                        else:
                            m['runs'].append({'br': True})
                    elif rt == 'tab':
                        m['runs'].append({'tab': True})
                    elif rt == 'drawing':
                        cx = cy = rid = None
                        for ext in rn.iter('{%s}extent' % WP):
                            cx = num(ext.get('cx')) * EMU
                            cy = num(ext.get('cy')) * EMU
                            break
                        for blip in rn.iter('{%s}blip' % A_NS):
                            rid = blip.get('{%s}embed' % R)
                            break
                        obj = self.image(rid) if rid else None
                        if obj is not None and cx and cy:
                            pics.append((obj, cx, cy))
            elif t == 'fldSimple':
                instr = (node.get('{%s}instr' % W) or '').strip()
                m['runs'].append({'field': 'NUMPAGES' if 'NUMPAGES' in instr else 'PAGE'})
            elif t == 'hyperlink':
                for rn in node:
                    if tag(rn) == 'r':
                        tt = child(rn, 't')
                        if tt is not None and tt.text:
                            m['runs'].append({'text': tt.text, 'bold': False,
                                              'size': size0, 'color': None, 'cs': 0.0})
        m['size'] = max([r['size'] for r in m['runs'] if 'size' in r] or [self.default_size])
        if pics:
            m['pic'] = pics[0]
        return m

    # ---------- story ----------
    def story(self):
        body = self.doc.find('{%s}body' % W)
        for sect in body.findall('{%s}sectPr' % W):
            self.read_sect(sect)
        for ppr in body.iter('{%s}pPr' % W):
            s2 = child(ppr, 'sectPr')
            if s2 is not None:
                self.read_sect(s2)
        avail = self.sect['w'] - self.sect['ml'] - self.sect['mr']
        out = []
        for node in body:
            t = tag(node)
            if t == 'p':
                m = self.para_model(node)
                if m.get('page_break_before'):
                    out.append(PageBreak())
                if m.get('pic'):
                    obj, cx, cy = m['pic']
                    if cx > avail:
                        cy *= avail / cx
                        cx = avail
                    out.append(Pic(obj, cx, cy, m['jc']))
                    if m.get('page_break'):
                        out.append(PageBreak())
                    continue
                if not m['runs'] and not m['shading'] and not m['borders']:
                    out.append(Para(m, avail))
                else:
                    out.append(Para(m, avail))
                if m.get('page_break'):
                    out.append(PageBreak())
            elif t == 'tbl':
                tb = Tbl(self, node).build(avail)
                if tb is not None:
                    out.append(tb)
        return out

    #
    def hf(self, rid):
        """→ [(segments, border_top, border_bottom)]，segment=[(x_anchor, tabs, runs)]"""
        if not rid:
            return []
        target = self.rels.get(rid)
        if not target:
            return []
        name = target if target.startswith('word/') else ('word/' + target.lstrip('/'))
        try:
            root = ET.fromstring(self.z.read(name))
        except KeyError:
            return []
        out = []
        for p in root:
            if tag(p) != 'p':
                continue
            ppr = child(p, 'pPr')
            tabs = []
            border = {}
            if ppr is not None:
                for tb in kids(child(ppr, 'tabs'), 'tab'):
                    tabs.append((attr(tb, 'val', 'left'), num(attr(tb, 'pos'), 0) * TWIP))
                pbd = child(ppr, 'pBdr')
                if pbd is not None:
                    for side in ('top', 'bottom'):
                        s = child(pbd, side)
                        if s is not None and attr(s, 'val', 'single') not in ('nil', 'none'):
                            border[side] = (max(0.4, num(attr(s, 'sz'), 4) / 8.0),
                                            attr(s, 'color', 'C9D6E3') or 'C9D6E3',
                                            num(attr(s, 'space'), 0) * TWIP)
            runs = []
            for node in p:
                t = tag(node)
                if t == 'r':
                    rpr = child(node, 'rPr')
                    bold = child(rpr, 'b') is not None
                    color = attr(child(rpr, 'color'), 'val')
                    size = num(attr(child(rpr, 'sz'), 'val'), 20) / 2.0 if child(rpr, 'sz') is not None else 7.0
                    for rn in node:
                        rt = tag(rn)
                        if rt == 't':
                            runs.append({'text': rn.text or '', 'bold': bold,
                                         'color': color if color and color != 'auto' else None,
                                         'size': size, 'cs': 0.0})
                        elif rt == 'tab':
                            runs.append({'tab': True})
                elif t == 'fldSimple':
                    instr = (node.get('{%s}instr' % W) or '').strip()
                    size = 7.0
                    color = None
                    for rn in node:
                        if tag(rn) == 'r':
                            rpr = child(rn, 'rPr')
                            color = attr(child(rpr, 'color'), 'val')
                            size = num(attr(child(rpr, 'sz'), 'val'), 20) / 2.0 if child(rpr, 'sz') is not None else 7.0
                            break
                    runs.append({'field': 'NUMPAGES' if 'NUMPAGES' in instr else 'PAGE',
                                 'size': size, 'bold': False,
                                 'color': color if color and color != 'auto' else None, 'cs': 0.0})
            out.append((runs, tabs, border))
        return out

    def draw_hf(self, c, page_no, total, width):
        s = self.sect
        for runs, tabs, border in self.hf(s['header_part']):
            self._draw_hf_para(c, runs, tabs, border, width,
                               top=s['h'] - s['header'], page_no=page_no, total=total)
        for runs, tabs, border in self.hf(s['footer_part']):
            self._draw_hf_para(c, runs, tabs, border, width,
                               bottom=s['footer'], page_no=page_no, total=total)

    def _draw_hf_para(self, c, runs, tabs, border, width, top=None, bottom=None,
                      page_no=1, total=1):
        #
        segs = [[]]
        tab_used = []
        for r in runs:
            if r.get('tab'):
                segs.append([])
                tab_used.append(True)
            else:
                segs[-1].append(r)
        size = max([r['size'] for r in runs if 'size' in r] or [7.0])
        asc = ascent_of(LATIN, size)
        desc = descent_of(LATIN, size)
        if top is not None:
            base = top - asc
        else:
            base = bottom + desc
        x = 0.0
        positions = []
        stopper = list(tabs)
        for i, seg in enumerate(segs):
            if i == 0:
                positions.append(0.0)
                continue
            wsum = sum(sw(self._hf_text(r, page_no, total), face(r['bold'], CJK_RE.search(self._hf_text(r, page_no, total)) is not None), r['size'], r['cs'])
                       for r in seg)
            if stopper:
                kind, pos = stopper.pop(0)
                if kind == 'right':
                    positions.append(pos - wsum)
                elif kind in ('center', 'centre'):
                    positions.append(pos - wsum / 2.0)
                else:
                    positions.append(pos)
            else:
                positions.append(x)
        for i, seg in enumerate(segs):
            x = positions[i]
            for r in seg:
                txt = self._hf_text(r, page_no, total)
                if not txt:
                    continue
                cjk = CJK_RE.search(txt) is not None
                f = face(r['bold'], cjk)
                c.setFont(f, r['size'])
                c.setFillColor(HexColor('#' + r['color']) if r['color'] else HexColor('#333333'))
                c.drawString(x, base, txt)
                trace(c, x, base, txt, 'hf')
                x += sw(txt, f, r['size'], r['cs'])
        for side, (bw, bcolor, space) in border.items():
            c.setStrokeColor(HexColor('#' + bcolor))
            c.setLineWidth(bw)
            y = (base + desc - space) if side == 'bottom' else (base + asc + space)
            c.line(0, y, width, y)

    @staticmethod
    def _hf_text(r, page_no, total):
        if 'field' in r:
            return str(total if r['field'] == 'NUMPAGES' else page_no)
        return r.get('text', '')


#
class LimtecCanvas(pdfcanvas.Canvas):
    def __init__(self, *a, **kw):
        self._conv = kw.pop('conv')
        self._saved = []
        pdfcanvas.Canvas.__init__(self, *a, **kw)

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self._decorate(total)
            pdfcanvas.Canvas.showPage(self)
        pdfcanvas.Canvas.save(self)

    def _decorate(self, total):
        conv = self._conv
        s = conv.sect
        w, h = s['w'], s['h']
        c = self
        if not PLAIN:
            c.saveState()
            c.setFillColor(Color(0.60, 0.66, 0.63, alpha=0.10))
            c.setFont(CJK_B or CJK, 64)
            c.translate(w / 2.0, h / 2.0)
            c.rotate(45)
            c.drawCentredString(0, -22, WATERMARK)
            c.restoreState()
        c.saveState()
        c.translate(s['ml'], 0)
        conv.draw_hf(c, c.getPageNumber(), total, w - s['ml'] - s['mr'])
        c.restoreState()
        if not PLAIN:
            c.saveState()
            c.setFont(face(False, True), 6.5)
            c.setFillColor(Color(0.55, 0.58, 0.57, alpha=0.9))
            c.drawRightString(w - s['mr'], s['footer'] - 12, COPYRIGHT)
            c.restoreState()


def convert(docx_path, out_pdf):
    conv = Converter(docx_path)
    story = conv.story()
    s = conv.sect
    doc = BaseDocTemplate(out_pdf, pagesize=(s['w'], s['h']),
                          leftMargin=s['ml'], rightMargin=s['mr'],
                          topMargin=s['mt'], bottomMargin=s['mb'],
                          title=os.environ.get('LIMTEC_PDF_TITLE', '力姆泰克选型方案书'),
                          author=os.environ.get('LIMTEC_PDF_AUTHOR', '力姆泰克（北京）传动设备股份有限公司'))
    frame = Frame(s['ml'], s['mb'], s['w'] - s['ml'] - s['mr'],
                  s['h'] - s['mt'] - s['mb'], id='f',
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='p', frames=[frame])])
    doc.build(story, canvasmaker=lambda *a, **kw: LimtecCanvas(*a, conv=conv, **kw))
    trace_flush()
    return os.path.getsize(out_pdf)


def selftest():
    here = os.path.dirname(os.path.abspath(__file__))
    node = shutil.which('node') or '/data/storage/el1/bundle/libs/arm64/node/bin/node'
    docx_tmp = '/tmp/limtec_selftest_docx.docx'
    r = subprocess.run([node, os.path.join(here, 'make_docx.js'), '--product=screwjack',
                        '--demo', '--docx=' + docx_tmp], capture_output=True, text=True, timeout=180)
    if r.returncode != 0 or not os.path.exists(docx_tmp):
        print((r.stdout or '')[-1500:], (r.stderr or '')[-1500:])
        print('selftest 失败：docx 生成不通过')
        return 1
    out = '/tmp/limtec_selftest_pdf.pdf'
    size = convert(docx_tmp, out)
    with open(out, 'rb') as f:
        assert f.read(5) == b'%PDF-', 'PDF 文件头异常'
    print('selftest OK:', out, size, 'bytes')
    return 0


EN_DEFAULTS = {
    'LIMTEC_WATERMARK': 'Lim-Tec',
    'LIMTEC_COPYRIGHT': 'Copyright (c) Lim-Tec (Beijing) Transmission Equipment Co., Ltd. All rights reserved.',
    'LIMTEC_PDF_TITLE': 'Lim-Tec Selection Proposal',
    'LIMTEC_PDF_AUTHOR': 'Lim-Tec (Beijing) Transmission Equipment Co., Ltd.',
}


def main():
    global PLAIN, WATERMARK, COPYRIGHT
    args = [a for a in sys.argv[1:]]
    if '--plain' in args:
        PLAIN = True
        args.remove('--plain')
    if '--en' in args:
        #
        args.remove('--en')
        for k, v in EN_DEFAULTS.items():
            os.environ.setdefault(k, v)
        WATERMARK = os.environ['LIMTEC_WATERMARK']
        COPYRIGHT = os.environ['LIMTEC_COPYRIGHT']
    init_fonts()
    if '--selftest' in args:
        return selftest()
    if len(args) < 2:
        print(__doc__)
        return 2
    size = convert(args[0], args[1])
    print('PDF 已生成：', args[1], size, 'bytes')
    return 0


if __name__ == '__main__':
    sys.exit(main())
