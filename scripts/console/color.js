var rgbToString = (c) => {
    return `${c.r},${c.g},${c.b}`;
};

var componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
};
var expandHex = function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (_m, r, g, b) {
        return r + r + g + g + b + b;
    });
    return "#" + hex.replace('#', '');
};
var hexToRGB = function (hex) {
    hex = expandHex(hex);
    hex = hex.replace('#', '');
    var intValue = parseInt(hex, 16);
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255
    };
};
var hslToRGB = function (_a) {
    var h = _a.h, s = _a.s, l = _a.l;
    h = h / 360;
    s = s / 100;
    l = l / 100;
    if (s === 0) {
        l = Math.round(l * 255);
        return {
            r: l,
            g: l,
            b: l
        };
    }
    // tslint:disable-next-line:no-shadowed-variable
    var hue2rgb = function (p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var r = hue2rgb(p, q, h + (1 / 3));
    var g = hue2rgb(p, q, h);
    var b = hue2rgb(p, q, h - (1 / 3));
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};
var mixColors = function (color, mixColor, weight) {
    if (weight === void 0) { weight = .5; }
    var colorRGB = color.rgb;
    var mixColorRGB = mixColor.rgb;
    var mixColorWeight = 1 - weight;
    return {
        r: Math.round(weight * mixColorRGB.r + mixColorWeight * colorRGB.r),
        g: Math.round(weight * mixColorRGB.g + mixColorWeight * colorRGB.g),
        b: Math.round(weight * mixColorRGB.b + mixColorWeight * colorRGB.b)
    };
};
var rgbToHex = function (_a) {
    var r = _a.r, g = _a.g, b = _a.b;
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
var rgbToHSL = function (_a) {
    var r = _a.r, g = _a.g, b = _a.b;
    r = Math.max(Math.min(r / 255, 1), 0);
    g = Math.max(Math.min(g / 255, 1), 0);
    b = Math.max(Math.min(b / 255, 1), 0);
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var l = Math.min(1, Math.max(0, (max + min) / 2));
    var d;
    var h;
    var s;
    if (max !== min) {
        d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        }
        else if (max === g) {
            h = (b - r) / d + 2;
        }
        else {
            h = (r - g) / d + 4;
        }
        h = h / 6;
    }
    else {
        h = s = 0;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};
var rgbToYIQ = function (_a) {
    var r = _a.r, g = _a.g, b = _a.b;
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};
class Color {
    constructor(value) {
        if (typeof (value) === 'string' && /rgb\(/.test(value)) {
            const matches = /rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/.exec(value) || [];
            value = { r: parseInt(matches[0], 10), g: parseInt(matches[1], 10), b: parseInt(matches[2], 10) };
        } else if (typeof (value) === 'string' && /hsl\(/.test(value)) {
            const matches = /hsl\((\d{1,3}), ?(\d{1,3}%), ?(\d{1,3}%)\)/.exec(value) || [];
            value = { h: parseInt(matches[0], 10), s: parseInt(matches[1], 10), l: parseInt(matches[2], 10) };
        }
        if (typeof (value) === 'string') {
            value = value.replace(/\s/g, '');
            this.hex = expandHex(value);
            this.rgb = hexToRGB(this.hex);
            this.hsl = rgbToHSL(this.rgb);
        }
        else if ('r' in value && 'g' in value && 'b' in value) {
            this.rgb = value;
            this.hex = rgbToHex(this.rgb);
            this.hsl = rgbToHSL(this.rgb);
        }
        else if ('h' in value && 's' in value && 'l' in value) {
            this.hsl = value;
            this.rgb = hslToRGB(this.hsl);
            this.hex = rgbToHex(this.rgb);
        }
        else {
            throw new Error('Incorrect value passed.');
        }
        this.yiq = rgbToYIQ(this.rgb);
    }
    contrast(threshold) {
        if (threshold === void 0) { threshold = 128; }
        return new Color((this.yiq >= threshold ? '#000' : '#fff'));
    }
    mix(from, amount) {
        if (amount === void 0) { amount = .5; }
        var base = from instanceof Color ? from : new Color(from);
        return new Color(mixColors(this, base, amount));
    }
    shade(weight) {
        if (weight === void 0) { weight = .12; }
        return this.mix({ r: 0, g: 0, b: 0 }, weight);
    }
    tint(weight) {
        if (weight === void 0) { weight = .1; }
        return this.mix({ r: 255, g: 255, b: 255 }, weight);
    }
    toList() {
        var _a = this.rgb, r = _a.r, g = _a.g, b = _a.b;
        return r + "," + g + "," + b;
    }
    static isColor(value) {
        if (/rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/.test(value)) {
            return true;
        }
        return /(^#[0-9a-fA-F]+)/.test(value.trim());
    }
}




var generateColor = function (value) {
    var color = new Color(value);
    var contrast = color.contrast();
    var tint = color.tint();
    var shade = color.shade();

    return {
        value: value,
        valueRgb: rgbToString(color.rgb),
        contrast: contrast.hex,
        contrastRgb: rgbToString(contrast.rgb),
        tint: tint.hex,
        shade: shade.hex,
    };
};


var getCssText = function (name, value) {
    const color = generateColor(value);
    return `
:root {
    --color-${name}: ${color.value};
    --color-${name}-rgb: ${color.valueRgb};
    --color-${name}-contrast: ${color.contrast};
    --color-${name}-contrast-rgb: ${color.contrastRgb};
    --color-${name}-shade: ${color.shade};
    --color-${name}-tint: ${color.tint};
}
`;
};

hexo.extend.console.register('color', '创建新的颜色', {
    usage: '[name] <color>',
    arguments: [
        { name: 'name', desc: '颜色名称' },
        { name: 'color', desc: '颜色值' }
    ],
}, function (args) {
    if (args._.length === 2) {
        console.log(getCssText(args._[0], `#${args._[1]}`))
    }
})