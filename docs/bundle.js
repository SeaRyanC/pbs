// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var s;
var a;
var h;
var p = {};
var v = [];
var y = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var d = Array.isArray;
function w(n2, l3) {
  for (var u4 in l3) n2[u4] = l3[u4];
  return n2;
}
function _(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function g(l3, u4, t3) {
  var i4, r3, o3, e3 = {};
  for (o3 in u4) "key" == o3 ? i4 = u4[o3] : "ref" == o3 ? r3 = u4[o3] : e3[o3] = u4[o3];
  if (arguments.length > 2 && (e3.children = arguments.length > 3 ? n.call(arguments, 2) : t3), "function" == typeof l3 && null != l3.defaultProps) for (o3 in l3.defaultProps) void 0 === e3[o3] && (e3[o3] = l3.defaultProps[o3]);
  return m(l3, e3, i4, r3, null);
}
function m(n2, t3, i4, r3, o3) {
  var e3 = { type: n2, props: t3, key: i4, ref: r3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u : o3, __i: -1, __u: 0 };
  return null == o3 && null != l.vnode && l.vnode(e3), e3;
}
function k(n2) {
  return n2.children;
}
function x(n2, l3) {
  this.props = n2, this.context = l3;
}
function C(n2, l3) {
  if (null == l3) return n2.__ ? C(n2.__, n2.__i + 1) : null;
  for (var u4; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) return u4.__e;
  return "function" == typeof n2.type ? C(n2) : null;
}
function S(n2) {
  var l3, u4;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++) if (null != (u4 = n2.__k[l3]) && null != u4.__e) {
      n2.__e = n2.__c.base = u4.__e;
      break;
    }
    return S(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !P.__r++ || r !== l.debounceRendering) && ((r = l.debounceRendering) || o)(P);
}
function P() {
  var n2, u4, t3, r3, o3, f4, c3, s3;
  for (i.sort(e); n2 = i.shift(); ) n2.__d && (u4 = i.length, r3 = void 0, f4 = (o3 = (t3 = n2).__v).__e, c3 = [], s3 = [], t3.__P && ((r3 = w({}, o3)).__v = o3.__v + 1, l.vnode && l.vnode(r3), j(t3.__P, r3, o3, t3.__n, t3.__P.namespaceURI, 32 & o3.__u ? [f4] : null, c3, null == f4 ? C(o3) : f4, !!(32 & o3.__u), s3), r3.__v = o3.__v, r3.__.__k[r3.__i] = r3, z(c3, r3, s3), r3.__e != f4 && S(r3)), i.length > u4 && i.sort(e));
  P.__r = 0;
}
function $(n2, l3, u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, y3, d3, w3, _2, g2 = t3 && t3.__k || v, m3 = l3.length;
  for (f4 = I(u4, l3, g2, f4, m3), a3 = 0; a3 < m3; a3++) null != (y3 = u4.__k[a3]) && (h3 = -1 === y3.__i ? p : g2[y3.__i] || p, y3.__i = a3, _2 = j(n2, y3, h3, i4, r3, o3, e3, f4, c3, s3), d3 = y3.__e, y3.ref && h3.ref != y3.ref && (h3.ref && V(h3.ref, null, y3), s3.push(y3.ref, y3.__c || d3, y3)), null == w3 && null != d3 && (w3 = d3), 4 & y3.__u || h3.__k === y3.__k ? f4 = A(y3, f4, n2) : "function" == typeof y3.type && void 0 !== _2 ? f4 = _2 : d3 && (f4 = d3.nextSibling), y3.__u &= -7);
  return u4.__e = w3, f4;
}
function I(n2, l3, u4, t3, i4) {
  var r3, o3, e3, f4, c3, s3 = u4.length, a3 = s3, h3 = 0;
  for (n2.__k = new Array(i4), r3 = 0; r3 < i4; r3++) null != (o3 = l3[r3]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f4 = r3 + h3, (o3 = n2.__k[r3] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m(null, o3, null, null, null) : d(o3) ? m(k, { children: o3 }, null, null, null) : void 0 === o3.constructor && o3.__b > 0 ? m(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e3 = null, -1 !== (c3 = o3.__i = L(o3, u4, f4, a3)) && (a3--, (e3 = u4[c3]) && (e3.__u |= 2)), null == e3 || null === e3.__v ? (-1 == c3 && h3--, "function" != typeof o3.type && (o3.__u |= 4)) : c3 != f4 && (c3 == f4 - 1 ? h3-- : c3 == f4 + 1 ? h3++ : (c3 > f4 ? h3-- : h3++, o3.__u |= 4))) : n2.__k[r3] = null;
  if (a3) for (r3 = 0; r3 < s3; r3++) null != (e3 = u4[r3]) && 0 == (2 & e3.__u) && (e3.__e == t3 && (t3 = C(e3)), q(e3, e3));
  return t3;
}
function A(n2, l3, u4) {
  var t3, i4;
  if ("function" == typeof n2.type) {
    for (t3 = n2.__k, i4 = 0; t3 && i4 < t3.length; i4++) t3[i4] && (t3[i4].__ = n2, l3 = A(t3[i4], l3, u4));
    return l3;
  }
  n2.__e != l3 && (l3 && n2.type && !u4.contains(l3) && (l3 = C(n2)), u4.insertBefore(n2.__e, l3 || null), l3 = n2.__e);
  do {
    l3 = l3 && l3.nextSibling;
  } while (null != l3 && 8 == l3.nodeType);
  return l3;
}
function L(n2, l3, u4, t3) {
  var i4, r3, o3 = n2.key, e3 = n2.type, f4 = l3[u4];
  if (null === f4 || f4 && o3 == f4.key && e3 === f4.type && 0 == (2 & f4.__u)) return u4;
  if (t3 > (null != f4 && 0 == (2 & f4.__u) ? 1 : 0)) for (i4 = u4 - 1, r3 = u4 + 1; i4 >= 0 || r3 < l3.length; ) {
    if (i4 >= 0) {
      if ((f4 = l3[i4]) && 0 == (2 & f4.__u) && o3 == f4.key && e3 === f4.type) return i4;
      i4--;
    }
    if (r3 < l3.length) {
      if ((f4 = l3[r3]) && 0 == (2 & f4.__u) && o3 == f4.key && e3 === f4.type) return r3;
      r3++;
    }
  }
  return -1;
}
function T(n2, l3, u4) {
  "-" == l3[0] ? n2.setProperty(l3, null == u4 ? "" : u4) : n2[l3] = null == u4 ? "" : "number" != typeof u4 || y.test(l3) ? u4 : u4 + "px";
}
function F(n2, l3, u4, t3, i4) {
  var r3;
  n: if ("style" == l3) if ("string" == typeof u4) n2.style.cssText = u4;
  else {
    if ("string" == typeof t3 && (n2.style.cssText = t3 = ""), t3) for (l3 in t3) u4 && l3 in u4 || T(n2.style, l3, "");
    if (u4) for (l3 in u4) t3 && u4[l3] === t3[l3] || T(n2.style, l3, u4[l3]);
  }
  else if ("o" == l3[0] && "n" == l3[1]) r3 = l3 != (l3 = l3.replace(f, "$1")), l3 = l3.toLowerCase() in n2 || "onFocusOut" == l3 || "onFocusIn" == l3 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + r3] = u4, u4 ? t3 ? u4.u = t3.u : (u4.u = c, n2.addEventListener(l3, r3 ? a : s, r3)) : n2.removeEventListener(l3, r3 ? a : s, r3);
  else {
    if ("http://www.w3.org/2000/svg" == i4) l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l3 && "height" != l3 && "href" != l3 && "list" != l3 && "form" != l3 && "tabIndex" != l3 && "download" != l3 && "rowSpan" != l3 && "colSpan" != l3 && "role" != l3 && "popover" != l3 && l3 in n2) try {
      n2[l3] = null == u4 ? "" : u4;
      break n;
    } catch (n3) {
    }
    "function" == typeof u4 || (null == u4 || false === u4 && "-" != l3[4] ? n2.removeAttribute(l3) : n2.setAttribute(l3, "popover" == l3 && 1 == u4 ? "" : u4));
  }
}
function O(n2) {
  return function(u4) {
    if (this.l) {
      var t3 = this.l[u4.type + n2];
      if (null == u4.t) u4.t = c++;
      else if (u4.t < t3.u) return;
      return t3(l.event ? l.event(u4) : u4);
    }
  };
}
function j(n2, u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, p3, v3, y3, g2, m3, b, C3, S2, M2, P2, I2, A3, H, L2, T3, F2 = u4.type;
  if (void 0 !== u4.constructor) return null;
  128 & t3.__u && (c3 = !!(32 & t3.__u), o3 = [f4 = u4.__e = t3.__e]), (a3 = l.__b) && a3(u4);
  n: if ("function" == typeof F2) try {
    if (b = u4.props, C3 = "prototype" in F2 && F2.prototype.render, S2 = (a3 = F2.contextType) && i4[a3.__c], M2 = a3 ? S2 ? S2.props.value : a3.__ : i4, t3.__c ? m3 = (h3 = u4.__c = t3.__c).__ = h3.__E : (C3 ? u4.__c = h3 = new F2(b, M2) : (u4.__c = h3 = new x(b, M2), h3.constructor = F2, h3.render = B), S2 && S2.sub(h3), h3.props = b, h3.state || (h3.state = {}), h3.context = M2, h3.__n = i4, p3 = h3.__d = true, h3.__h = [], h3._sb = []), C3 && null == h3.__s && (h3.__s = h3.state), C3 && null != F2.getDerivedStateFromProps && (h3.__s == h3.state && (h3.__s = w({}, h3.__s)), w(h3.__s, F2.getDerivedStateFromProps(b, h3.__s))), v3 = h3.props, y3 = h3.state, h3.__v = u4, p3) C3 && null == F2.getDerivedStateFromProps && null != h3.componentWillMount && h3.componentWillMount(), C3 && null != h3.componentDidMount && h3.__h.push(h3.componentDidMount);
    else {
      if (C3 && null == F2.getDerivedStateFromProps && b !== v3 && null != h3.componentWillReceiveProps && h3.componentWillReceiveProps(b, M2), !h3.__e && (null != h3.shouldComponentUpdate && false === h3.shouldComponentUpdate(b, h3.__s, M2) || u4.__v == t3.__v)) {
        for (u4.__v != t3.__v && (h3.props = b, h3.state = h3.__s, h3.__d = false), u4.__e = t3.__e, u4.__k = t3.__k, u4.__k.some(function(n3) {
          n3 && (n3.__ = u4);
        }), P2 = 0; P2 < h3._sb.length; P2++) h3.__h.push(h3._sb[P2]);
        h3._sb = [], h3.__h.length && e3.push(h3);
        break n;
      }
      null != h3.componentWillUpdate && h3.componentWillUpdate(b, h3.__s, M2), C3 && null != h3.componentDidUpdate && h3.__h.push(function() {
        h3.componentDidUpdate(v3, y3, g2);
      });
    }
    if (h3.context = M2, h3.props = b, h3.__P = n2, h3.__e = false, I2 = l.__r, A3 = 0, C3) {
      for (h3.state = h3.__s, h3.__d = false, I2 && I2(u4), a3 = h3.render(h3.props, h3.state, h3.context), H = 0; H < h3._sb.length; H++) h3.__h.push(h3._sb[H]);
      h3._sb = [];
    } else do {
      h3.__d = false, I2 && I2(u4), a3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s;
    } while (h3.__d && ++A3 < 25);
    h3.state = h3.__s, null != h3.getChildContext && (i4 = w(w({}, i4), h3.getChildContext())), C3 && !p3 && null != h3.getSnapshotBeforeUpdate && (g2 = h3.getSnapshotBeforeUpdate(v3, y3)), f4 = $(n2, d(L2 = null != a3 && a3.type === k && null == a3.key ? a3.props.children : a3) ? L2 : [L2], u4, t3, i4, r3, o3, e3, f4, c3, s3), h3.base = u4.__e, u4.__u &= -161, h3.__h.length && e3.push(h3), m3 && (h3.__E = h3.__ = null);
  } catch (n3) {
    if (u4.__v = null, c3 || null != o3) if (n3.then) {
      for (u4.__u |= c3 ? 160 : 128; f4 && 8 == f4.nodeType && f4.nextSibling; ) f4 = f4.nextSibling;
      o3[o3.indexOf(f4)] = null, u4.__e = f4;
    } else for (T3 = o3.length; T3--; ) _(o3[T3]);
    else u4.__e = t3.__e, u4.__k = t3.__k;
    l.__e(n3, u4, t3);
  }
  else null == o3 && u4.__v == t3.__v ? (u4.__k = t3.__k, u4.__e = t3.__e) : f4 = u4.__e = N(t3.__e, u4, t3, i4, r3, o3, e3, c3, s3);
  return (a3 = l.diffed) && a3(u4), 128 & u4.__u ? void 0 : f4;
}
function z(n2, u4, t3) {
  for (var i4 = 0; i4 < t3.length; i4++) V(t3[i4], t3[++i4], t3[++i4]);
  l.__c && l.__c(u4, n2), n2.some(function(u5) {
    try {
      n2 = u5.__h, u5.__h = [], n2.some(function(n3) {
        n3.call(u5);
      });
    } catch (n3) {
      l.__e(n3, u5.__v);
    }
  });
}
function N(u4, t3, i4, r3, o3, e3, f4, c3, s3) {
  var a3, h3, v3, y3, w3, g2, m3, b = i4.props, k3 = t3.props, x2 = t3.type;
  if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e3) {
    for (a3 = 0; a3 < e3.length; a3++) if ((w3 = e3[a3]) && "setAttribute" in w3 == !!x2 && (x2 ? w3.localName == x2 : 3 == w3.nodeType)) {
      u4 = w3, e3[a3] = null;
      break;
    }
  }
  if (null == u4) {
    if (null == x2) return document.createTextNode(k3);
    u4 = document.createElementNS(o3, x2, k3.is && k3), c3 && (l.__m && l.__m(t3, e3), c3 = false), e3 = null;
  }
  if (null === x2) b === k3 || c3 && u4.data === k3 || (u4.data = k3);
  else {
    if (e3 = e3 && n.call(u4.childNodes), b = i4.props || p, !c3 && null != e3) for (b = {}, a3 = 0; a3 < u4.attributes.length; a3++) b[(w3 = u4.attributes[a3]).name] = w3.value;
    for (a3 in b) if (w3 = b[a3], "children" == a3) ;
    else if ("dangerouslySetInnerHTML" == a3) v3 = w3;
    else if (!(a3 in k3)) {
      if ("value" == a3 && "defaultValue" in k3 || "checked" == a3 && "defaultChecked" in k3) continue;
      F(u4, a3, null, w3, o3);
    }
    for (a3 in k3) w3 = k3[a3], "children" == a3 ? y3 = w3 : "dangerouslySetInnerHTML" == a3 ? h3 = w3 : "value" == a3 ? g2 = w3 : "checked" == a3 ? m3 = w3 : c3 && "function" != typeof w3 || b[a3] === w3 || F(u4, a3, w3, b[a3], o3);
    if (h3) c3 || v3 && (h3.__html === v3.__html || h3.__html === u4.innerHTML) || (u4.innerHTML = h3.__html), t3.__k = [];
    else if (v3 && (u4.innerHTML = ""), $(u4, d(y3) ? y3 : [y3], t3, i4, r3, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e3, f4, e3 ? e3[0] : i4.__k && C(i4, 0), c3, s3), null != e3) for (a3 = e3.length; a3--; ) _(e3[a3]);
    c3 || (a3 = "value", "progress" == x2 && null == g2 ? u4.removeAttribute("value") : void 0 !== g2 && (g2 !== u4[a3] || "progress" == x2 && !g2 || "option" == x2 && g2 !== b[a3]) && F(u4, a3, g2, b[a3], o3), a3 = "checked", void 0 !== m3 && m3 !== u4[a3] && F(u4, a3, m3, b[a3], o3));
  }
  return u4;
}
function V(n2, u4, t3) {
  try {
    if ("function" == typeof n2) {
      var i4 = "function" == typeof n2.__u;
      i4 && n2.__u(), i4 && null == u4 || (n2.__u = n2(u4));
    } else n2.current = u4;
  } catch (n3) {
    l.__e(n3, t3);
  }
}
function q(n2, u4, t3) {
  var i4, r3;
  if (l.unmount && l.unmount(n2), (i4 = n2.ref) && (i4.current && i4.current !== n2.__e || V(i4, null, u4)), null != (i4 = n2.__c)) {
    if (i4.componentWillUnmount) try {
      i4.componentWillUnmount();
    } catch (n3) {
      l.__e(n3, u4);
    }
    i4.base = i4.__P = null;
  }
  if (i4 = n2.__k) for (r3 = 0; r3 < i4.length; r3++) i4[r3] && q(i4[r3], u4, t3 || "function" != typeof n2.type);
  t3 || _(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function B(n2, l3, u4) {
  return this.constructor(n2, u4);
}
function D(u4, t3, i4) {
  var r3, o3, e3, f4;
  t3 == document && (t3 = document.documentElement), l.__ && l.__(u4, t3), o3 = (r3 = "function" == typeof i4) ? null : i4 && i4.__k || t3.__k, e3 = [], f4 = [], j(t3, u4 = (!r3 && i4 || t3).__k = g(k, null, [u4]), o3 || p, p, t3.namespaceURI, !r3 && i4 ? [i4] : o3 ? null : t3.firstChild ? n.call(t3.childNodes) : null, e3, !r3 && i4 ? i4 : o3 ? o3.__e : t3.firstChild, r3, f4), z(e3, u4, f4);
}
n = v.slice, l = { __e: function(n2, l3, u4, t3) {
  for (var i4, r3, o3; l3 = l3.__; ) if ((i4 = l3.__c) && !i4.__) try {
    if ((r3 = i4.constructor) && null != r3.getDerivedStateFromError && (i4.setState(r3.getDerivedStateFromError(n2)), o3 = i4.__d), null != i4.componentDidCatch && (i4.componentDidCatch(n2, t3 || {}), o3 = i4.__d), o3) return i4.__E = i4;
  } catch (l4) {
    n2 = l4;
  }
  throw n2;
} }, u = 0, t = function(n2) {
  return null != n2 && null == n2.constructor;
}, x.prototype.setState = function(n2, l3) {
  var u4;
  u4 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = w({}, this.state), "function" == typeof n2 && (n2 = n2(w({}, u4), this.props)), n2 && w(u4, n2), null != n2 && this.__v && (l3 && this._sb.push(l3), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l3) {
  return n2.__v.__b - l3.__v.__b;
}, P.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = O(false), a = O(true), h = 0;

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function d2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u4 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u4.__.length && u4.__.push({}), u4.__[n2];
}
function h2(n2) {
  return o2 = 1, p2(D2, n2);
}
function p2(n2, u4, i4) {
  var o3 = d2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i4 ? i4(u4) : D2(void 0, u4), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.u)) {
    var f4 = function(n3, t3, r3) {
      if (!o3.__c.__H) return true;
      var u5 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u5.every(function(n4) {
        return !n4.__N;
      })) return !c3 || c3.call(this, n3, t3, r3);
      var i5 = o3.__c.props !== n3;
      return u5.forEach(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i5 = true);
        }
      }), c3 && c3.call(this, n3, t3, r3) || i5;
    };
    r2.u = true;
    var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u5 = c3;
        c3 = void 0, f4(n3, t3, r3), c3 = u5;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f4;
  }
  return o3.__N || o3.__;
}
function y2(n2, u4) {
  var i4 = d2(t2++, 3);
  !c2.__s && C2(i4.__H, u4) && (i4.__ = n2, i4.i = u4, r2.__H.__h.push(i4));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u4 = d2(t2++, 7);
  return C2(u4.__H, r3) && (u4.__ = n2(), u4.__H = r3, u4.__h = n2), u4.__;
}
function q2(n2, t3) {
  return o2 = 8, T2(function() {
    return n2;
  }, t3);
}
function j2() {
  for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
  } catch (t3) {
    n2.__H.__h = [], c2.__e(t3, n2.__v);
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i4 = (r2 = n2.__c).__H;
  i4 && (u2 === r2 ? (i4.__h = [], r2.__h = [], i4.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.i = n3.__N = void 0;
  })) : (i4.__h.forEach(z2), i4.__h.forEach(B2), i4.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
    n3.i && (n3.__H = n3.i), n3.i = void 0;
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
};
var k2 = "function" == typeof requestAnimationFrame;
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u4), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u4 = setTimeout(r3, 100);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u4 = n2.__c;
  "function" == typeof u4 && (n2.__c = void 0, u4()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// src/types.ts
var COLOR_METHODS = [
  {
    id: "mean",
    name: "Mean Average",
    description: "Average of all pixel colors in the cell"
  },
  {
    id: "median",
    name: "Median",
    description: "Median color value of all pixels"
  },
  {
    id: "mode",
    name: "Mode (Most Common)",
    description: "Most frequently occurring color"
  },
  {
    id: "kernelMedian",
    name: "Kernel Median",
    description: "Median using a gaussian-weighted kernel"
  },
  {
    id: "centerWeighted",
    name: "Center Weighted",
    description: "Center pixel weighted more heavily"
  }
];
var DEFAULT_STATE = {
  sourceImage: null,
  gridCorners: {
    topLeft: { x: 50, y: 50 },
    topRight: { x: 350, y: 50 },
    bottomLeft: { x: 50, y: 350 },
    bottomRight: { x: 350, y: 350 }
  },
  rotation: 0,
  perspectiveSkewX: 0,
  perspectiveSkewY: 0,
  outputWidth: 64,
  outputHeight: 64,
  colorMethod: "mean",
  isometric: true
};
var STORAGE_KEY = "pbs-app-state";
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save state to localStorage");
  }
}
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    console.warn("Failed to load state from localStorage");
  }
  return { ...DEFAULT_STATE };
}

// src/imageProcessing.ts
var ISOMETRIC_ANGLE_DEGREES = 30;
var ISOMETRIC_SCALE_FACTOR = 0.5;
var SKEW_INTENSITY = 0.1;
var NON_ISOMETRIC_SKEW_FACTOR = 5;
function perspectiveTransform(corners, u4, v3) {
  const { topLeft, topRight, bottomLeft, bottomRight } = corners;
  const topX = topLeft.x + (topRight.x - topLeft.x) * u4;
  const topY = topLeft.y + (topRight.y - topLeft.y) * u4;
  const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * u4;
  const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * u4;
  return {
    x: topX + (bottomX - topX) * v3,
    y: topY + (bottomY - topY) * v3
  };
}
function getPixelFromImageData(imageData, x2, y3) {
  const px = Math.floor(x2);
  const py = Math.floor(y3);
  if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const idx = (py * imageData.width + px) * 4;
  return {
    r: imageData.data[idx] ?? 0,
    g: imageData.data[idx + 1] ?? 0,
    b: imageData.data[idx + 2] ?? 0,
    a: imageData.data[idx + 3] ?? 255
  };
}
function collectCellPixels(imageData, corners, cellX, cellY, gridWidth, gridHeight, sampleSize = 5) {
  const pixels = [];
  const u0 = cellX / gridWidth;
  const u1 = (cellX + 1) / gridWidth;
  const v0 = cellY / gridHeight;
  const v1 = (cellY + 1) / gridHeight;
  for (let i4 = 0; i4 < sampleSize; i4++) {
    for (let j3 = 0; j3 < sampleSize; j3++) {
      const u4 = u0 + (u1 - u0) * (i4 + 0.5) / sampleSize;
      const v3 = v0 + (v1 - v0) * (j3 + 0.5) / sampleSize;
      const point = perspectiveTransform(corners, u4, v3);
      const pixel = getPixelFromImageData(imageData, point.x, point.y);
      if (pixel.a > 0) {
        pixels.push(pixel);
      }
    }
  }
  return pixels;
}
function meanColor(pixels) {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  let r3 = 0, g2 = 0, b = 0, a3 = 0;
  for (const p3 of pixels) {
    r3 += p3.r;
    g2 += p3.g;
    b += p3.b;
    a3 += p3.a;
  }
  const n2 = pixels.length;
  return {
    r: Math.round(r3 / n2),
    g: Math.round(g2 / n2),
    b: Math.round(b / n2),
    a: Math.round(a3 / n2)
  };
}
function medianColor(pixels) {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const sorted = {
    r: [...pixels].sort((a3, b) => a3.r - b.r),
    g: [...pixels].sort((a3, b) => a3.g - b.g),
    b: [...pixels].sort((a3, b) => a3.b - b.b),
    a: [...pixels].sort((a3, b) => a3.a - b.a)
  };
  const mid = Math.floor(pixels.length / 2);
  return {
    r: sorted.r[mid]?.r ?? 0,
    g: sorted.g[mid]?.g ?? 0,
    b: sorted.b[mid]?.b ?? 0,
    a: sorted.a[mid]?.a ?? 255
  };
}
function modeColor(pixels) {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const colorCounts = /* @__PURE__ */ new Map();
  for (const p3 of pixels) {
    const qr = Math.round(p3.r / 16) * 16;
    const qg = Math.round(p3.g / 16) * 16;
    const qb = Math.round(p3.b / 16) * 16;
    const key = `${qr},${qg},${qb}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, color: p3 });
    }
  }
  let maxCount = 0;
  let modePixel = pixels[0] ?? { r: 0, g: 0, b: 0, a: 0 };
  for (const { count, color } of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      modePixel = color;
    }
  }
  return modePixel;
}
function kernelMedianColor(pixels) {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const weights = [];
  const size = Math.sqrt(pixels.length);
  const center = (size - 1) / 2;
  for (let i4 = 0; i4 < pixels.length; i4++) {
    const row = Math.floor(i4 / size);
    const col = i4 % size;
    const dx = col - center;
    const dy = row - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    weights.push(Math.exp(-dist * dist / (2 * center * center)));
  }
  const weighted = pixels.map((p3, i4) => ({
    pixel: p3,
    weight: weights[i4] ?? 1
  }));
  const totalWeight = weights.reduce((sum, w3) => sum + w3, 0);
  const halfWeight = totalWeight / 2;
  const findWeightedMedian = (sorted, getValue) => {
    let cumWeight = 0;
    for (const { pixel, weight } of sorted.sort(
      (a3, b) => getValue(a3.pixel) - getValue(b.pixel)
    )) {
      cumWeight += weight;
      if (cumWeight >= halfWeight) return getValue(pixel);
    }
    return getValue(sorted[sorted.length - 1]?.pixel ?? { r: 0, g: 0, b: 0, a: 0 });
  };
  return {
    r: Math.round(findWeightedMedian([...weighted], (p3) => p3.r)),
    g: Math.round(findWeightedMedian([...weighted], (p3) => p3.g)),
    b: Math.round(findWeightedMedian([...weighted], (p3) => p3.b)),
    a: Math.round(findWeightedMedian([...weighted], (p3) => p3.a))
  };
}
function centerWeightedColor(pixels) {
  if (pixels.length === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const size = Math.sqrt(pixels.length);
  const center = Math.floor(size / 2);
  const centerIdx = center * size + center;
  const centerPixel = pixels[centerIdx];
  if (!centerPixel) return meanColor(pixels);
  let r3 = centerPixel.r * 4;
  let g2 = centerPixel.g * 4;
  let b = centerPixel.b * 4;
  let a3 = centerPixel.a * 4;
  let weight = 4;
  for (let i4 = 0; i4 < pixels.length; i4++) {
    if (i4 !== centerIdx) {
      const p3 = pixels[i4];
      if (p3) {
        r3 += p3.r;
        g2 += p3.g;
        b += p3.b;
        a3 += p3.a;
        weight++;
      }
    }
  }
  return {
    r: Math.round(r3 / weight),
    g: Math.round(g2 / weight),
    b: Math.round(b / weight),
    a: Math.round(a3 / weight)
  };
}
function computeCellColor(pixels, method) {
  switch (method) {
    case "mean":
      return meanColor(pixels);
    case "median":
      return medianColor(pixels);
    case "mode":
      return modeColor(pixels);
    case "kernelMedian":
      return kernelMedianColor(pixels);
    case "centerWeighted":
      return centerWeightedColor(pixels);
    default:
      return meanColor(pixels);
  }
}
function generatePixelatedImage(sourceImage, corners, outputWidth, outputHeight, colorMethod) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sourceImage.naturalWidth;
  tempCanvas.height = sourceImage.naturalHeight;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) {
    return new ImageData(outputWidth, outputHeight);
  }
  tempCtx.drawImage(sourceImage, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const output = new ImageData(outputWidth, outputHeight);
  for (let y3 = 0; y3 < outputHeight; y3++) {
    for (let x2 = 0; x2 < outputWidth; x2++) {
      const pixels = collectCellPixels(
        imageData,
        corners,
        x2,
        y3,
        outputWidth,
        outputHeight
      );
      const color = computeCellColor(pixels, colorMethod);
      const idx = (y3 * outputWidth + x2) * 4;
      output.data[idx] = color.r;
      output.data[idx + 1] = color.g;
      output.data[idx + 2] = color.b;
      output.data[idx + 3] = color.a;
    }
  }
  return output;
}
function rotatePoint(point, center, angleDeg) {
  const angleRad = angleDeg * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}
function getCornersCenter(corners) {
  return {
    x: (corners.topLeft.x + corners.topRight.x + corners.bottomLeft.x + corners.bottomRight.x) / 4,
    y: (corners.topLeft.y + corners.topRight.y + corners.bottomLeft.y + corners.bottomRight.y) / 4
  };
}
function applyPerspectiveSkew(corners, skewX, skewY, isometric) {
  if (isometric) {
    const center = getCornersCenter(corners);
    const isoAngleRad = ISOMETRIC_ANGLE_DEGREES * Math.PI / 180;
    return {
      topLeft: {
        x: corners.topLeft.x + (corners.topLeft.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.topLeft.y * (1 - Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      topRight: {
        x: corners.topRight.x + (corners.topRight.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.topRight.y * (1 - Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      bottomLeft: {
        x: corners.bottomLeft.x + (corners.bottomLeft.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.bottomLeft.y * (1 + Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      },
      bottomRight: {
        x: corners.bottomRight.x + (corners.bottomRight.y - center.y) * Math.tan(isoAngleRad) * skewX * SKEW_INTENSITY,
        y: corners.bottomRight.y * (1 + Math.abs(skewY) * SKEW_INTENSITY * ISOMETRIC_SCALE_FACTOR)
      }
    };
  }
  return {
    topLeft: {
      x: corners.topLeft.x - skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.topLeft.y - skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    topRight: {
      x: corners.topRight.x + skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.topRight.y - skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    bottomLeft: {
      x: corners.bottomLeft.x - skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.bottomLeft.y + skewY * NON_ISOMETRIC_SKEW_FACTOR
    },
    bottomRight: {
      x: corners.bottomRight.x + skewX * NON_ISOMETRIC_SKEW_FACTOR,
      y: corners.bottomRight.y + skewY * NON_ISOMETRIC_SKEW_FACTOR
    }
  };
}

// node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f3 = 0;
var i3 = Array.isArray;
function u3(e3, t3, n2, o3, i4, u4) {
  t3 || (t3 = {});
  var a3, c3, p3 = t3;
  if ("ref" in p3) for (c3 in p3 = {}, t3) "ref" == c3 ? a3 = t3[c3] : p3[c3] = t3[c3];
  var l3 = { type: e3, props: p3, key: n2, ref: a3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f3, __i: -1, __u: 0, __source: i4, __self: u4 };
  if ("function" == typeof e3 && (a3 = e3.defaultProps)) for (c3 in a3) void 0 === p3[c3] && (p3[c3] = a3[c3]);
  return l.vnode && l.vnode(l3), l3;
}

// src/App.tsx
function App() {
  const [state, setState] = h2(loadState);
  const [imageElement, setImageElement] = h2(null);
  const [isDragging, setIsDragging] = h2(false);
  const [dragCorner, setDragCorner] = h2(null);
  const [isDragOver, setIsDragOver] = h2(false);
  const containerRef = A2(null);
  const previewCanvasRef = A2(null);
  const fileInputRef = A2(null);
  y2(() => {
    saveState(state);
  }, [state]);
  y2(() => {
    if (state.sourceImage) {
      const img = new Image();
      img.onload = () => setImageElement(img);
      img.src = state.sourceImage;
    } else {
      setImageElement(null);
    }
  }, [state.sourceImage]);
  y2(() => {
    if (!imageElement || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = state.outputWidth;
    canvas.height = state.outputHeight;
    const scaledCorners = scaleCorners(state.gridCorners, imageElement);
    const skewedCorners = applyPerspectiveSkew(
      scaledCorners,
      state.perspectiveSkewX,
      state.perspectiveSkewY,
      state.isometric
    );
    const pixelData = generatePixelatedImage(
      imageElement,
      skewedCorners,
      state.outputWidth,
      state.outputHeight,
      state.colorMethod
    );
    ctx.putImageData(pixelData, 0, 0);
  }, [imageElement, state.gridCorners, state.outputWidth, state.outputHeight, state.colorMethod, state.perspectiveSkewX, state.perspectiveSkewY, state.isometric]);
  const scaleCorners = q2((corners2, img) => {
    const container = containerRef.current;
    if (!container || !img) return corners2;
    const rect = container.getBoundingClientRect();
    const displayedWidth = Math.min(rect.width, img.naturalWidth);
    const displayedHeight = Math.min(rect.height, img.naturalHeight);
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    let actualWidth = displayedWidth;
    let actualHeight = displayedWidth / aspectRatio;
    if (actualHeight > displayedHeight) {
      actualHeight = displayedHeight;
      actualWidth = displayedHeight * aspectRatio;
    }
    const scaleX = img.naturalWidth / actualWidth;
    const scaleY = img.naturalHeight / actualHeight;
    return {
      topLeft: { x: corners2.topLeft.x * scaleX, y: corners2.topLeft.y * scaleY },
      topRight: { x: corners2.topRight.x * scaleX, y: corners2.topRight.y * scaleY },
      bottomLeft: { x: corners2.bottomLeft.x * scaleX, y: corners2.bottomLeft.y * scaleY },
      bottomRight: { x: corners2.bottomRight.x * scaleX, y: corners2.bottomRight.y * scaleY }
    };
  }, []);
  const handleImageLoad = q2((dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const padding = 50;
      const container = containerRef.current;
      let width = 400;
      let height = 400;
      if (container) {
        const rect = container.getBoundingClientRect();
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        width = Math.min(rect.width - padding * 2, 600);
        height = width / aspectRatio;
        if (height > rect.height - padding * 2) {
          height = Math.min(rect.height - padding * 2, 600);
          width = height * aspectRatio;
        }
      }
      setState((prev) => ({
        ...prev,
        sourceImage: dataUrl,
        gridCorners: {
          topLeft: { x: padding, y: padding },
          topRight: { x: width + padding, y: padding },
          bottomLeft: { x: padding, y: height + padding },
          bottomRight: { x: width + padding, y: height + padding }
        }
      }));
    };
    img.src = dataUrl;
  }, []);
  const handleFileSelect = q2((file) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e3) => {
      const result = e3.target?.result;
      if (typeof result === "string") {
        handleImageLoad(result);
      }
    };
    reader.readAsDataURL(file);
  }, [handleImageLoad]);
  const handlePaste = q2((e3) => {
    const items = e3.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
          e3.preventDefault();
          break;
        }
      }
    }
  }, [handleFileSelect]);
  y2(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);
  const handleDrop = q2((e3) => {
    e3.preventDefault();
    setIsDragOver(false);
    const file = e3.dataTransfer?.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  const handleDragOver = q2((e3) => {
    e3.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = q2((e3) => {
    e3.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleUploadClick = q2(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileInputChange = q2((e3) => {
    const target = e3.target;
    const file = target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  const handleCornerMouseDown = q2((corner, e3) => {
    e3.preventDefault();
    e3.stopPropagation();
    setIsDragging(true);
    setDragCorner(corner);
  }, []);
  const handleMouseMove = q2((e3) => {
    if (!isDragging || !dragCorner || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x2 = e3.clientX - rect.left;
    const y3 = e3.clientY - rect.top;
    setState((prev) => ({
      ...prev,
      gridCorners: {
        ...prev.gridCorners,
        [dragCorner]: { x: x2, y: y3 }
      }
    }));
  }, [isDragging, dragCorner]);
  const handleMouseUp = q2(() => {
    setIsDragging(false);
    setDragCorner(null);
  }, []);
  y2(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return void 0;
  }, [isDragging, handleMouseMove, handleMouseUp]);
  const handleRotationChange = q2((rotation) => {
    setState((prev) => {
      const center = getCornersCenter(prev.gridCorners);
      const rotationDelta = rotation - prev.rotation;
      const newCorners = {
        topLeft: rotatePoint(prev.gridCorners.topLeft, center, rotationDelta),
        topRight: rotatePoint(prev.gridCorners.topRight, center, rotationDelta),
        bottomLeft: rotatePoint(prev.gridCorners.bottomLeft, center, rotationDelta),
        bottomRight: rotatePoint(prev.gridCorners.bottomRight, center, rotationDelta)
      };
      return {
        ...prev,
        rotation,
        gridCorners: newCorners
      };
    });
  }, []);
  const handleCopyToClipboard = q2(async () => {
    if (!previewCanvasRef.current) return;
    try {
      const blob = await new Promise(
        (resolve) => previewCanvasRef.current?.toBlob(resolve, "image/png")
      );
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, []);
  const handleDownload = q2(() => {
    if (!previewCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = `pixelated-${state.outputWidth}x${state.outputHeight}.png`;
    link.href = previewCanvasRef.current.toDataURL("image/png");
    link.click();
  }, [state.outputWidth, state.outputHeight]);
  const handleClearImage = q2(() => {
    setState((prev) => ({
      ...prev,
      sourceImage: null
    }));
  }, []);
  const handleResetGrid = q2(() => {
    if (!imageElement || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 50;
    const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    let width = Math.min(rect.width - padding * 2, 600);
    let height = width / aspectRatio;
    if (height > rect.height - padding * 2) {
      height = Math.min(rect.height - padding * 2, 600);
      width = height * aspectRatio;
    }
    setState((prev) => ({
      ...prev,
      gridCorners: {
        topLeft: { x: padding, y: padding },
        topRight: { x: width + padding, y: padding },
        bottomLeft: { x: padding, y: height + padding },
        bottomRight: { x: width + padding, y: height + padding }
      },
      rotation: 0
    }));
  }, [imageElement]);
  const corners = state.gridCorners;
  return /* @__PURE__ */ u3(k, { children: [
    /* @__PURE__ */ u3("header", { class: "app-header", children: /* @__PURE__ */ u3("h1", { children: "\u{1F3A8} Pixel-Based Crafting - Image Pixelator" }) }),
    /* @__PURE__ */ u3("main", { class: "app-main", children: [
      /* @__PURE__ */ u3("section", { class: "panel source-panel", children: [
        /* @__PURE__ */ u3("h2", { class: "panel-title", children: "Source Image" }),
        state.sourceImage && imageElement && /* @__PURE__ */ u3("div", { class: "image-controls", children: [
          /* @__PURE__ */ u3("button", { class: "btn btn-secondary", onClick: handleClearImage, children: "\u{1F5D1}\uFE0F Clear" }),
          /* @__PURE__ */ u3("button", { class: "btn btn-secondary", onClick: handleResetGrid, children: "\u{1F504} Reset Grid" }),
          /* @__PURE__ */ u3("button", { class: "btn btn-secondary", onClick: handleUploadClick, children: "\u{1F4C1} Change Image" })
        ] }),
        /* @__PURE__ */ u3(
          "div",
          {
            ref: containerRef,
            class: `image-container ${!state.sourceImage ? "drop-zone" : ""} ${isDragOver ? "drag-over" : ""}`,
            onDrop: handleDrop,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onClick: !state.sourceImage ? handleUploadClick : void 0,
            children: !state.sourceImage ? /* @__PURE__ */ u3(k, { children: [
              /* @__PURE__ */ u3("div", { class: "icon", children: "\u{1F4F7}" }),
              /* @__PURE__ */ u3("p", { children: /* @__PURE__ */ u3("strong", { children: "Drop image here" }) }),
              /* @__PURE__ */ u3("p", { children: "or click to upload" }),
              /* @__PURE__ */ u3("p", { children: "You can also paste from clipboard (Ctrl+V)" })
            ] }) : /* @__PURE__ */ u3(k, { children: [
              /* @__PURE__ */ u3(
                "img",
                {
                  src: state.sourceImage,
                  alt: "Source",
                  class: "source-image"
                }
              ),
              /* @__PURE__ */ u3("div", { class: "grid-overlay", children: /* @__PURE__ */ u3("svg", { children: [
                /* @__PURE__ */ u3(
                  "polygon",
                  {
                    class: "grid-fill",
                    points: `${corners.topLeft.x},${corners.topLeft.y} ${corners.topRight.x},${corners.topRight.y} ${corners.bottomRight.x},${corners.bottomRight.y} ${corners.bottomLeft.x},${corners.bottomLeft.y}`
                  }
                ),
                ["topLeft", "topRight", "bottomLeft", "bottomRight"].map((key) => {
                  const corner = corners[key];
                  return /* @__PURE__ */ u3(
                    "circle",
                    {
                      class: "grid-corner",
                      cx: corner.x,
                      cy: corner.y,
                      r: 12,
                      onMouseDown: (e3) => handleCornerMouseDown(key, e3)
                    },
                    key
                  );
                })
              ] }) })
            ] })
          }
        ),
        /* @__PURE__ */ u3(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: "image/*",
            class: "hidden-input",
            onChange: handleFileInputChange
          }
        )
      ] }),
      /* @__PURE__ */ u3("section", { class: "panel preview-panel", children: [
        /* @__PURE__ */ u3("h2", { class: "panel-title", children: [
          "Output Preview (",
          state.outputWidth,
          "\xD7",
          state.outputHeight,
          ")"
        ] }),
        /* @__PURE__ */ u3("div", { class: "preview-canvas", children: [
          /* @__PURE__ */ u3(
            "canvas",
            {
              ref: previewCanvasRef,
              style: {
                width: `${Math.min(state.outputWidth * 4, 256)}px`,
                height: `${Math.min(state.outputHeight * 4, 256)}px`
              }
            }
          ),
          state.sourceImage && /* @__PURE__ */ u3("div", { class: "btn-group", children: [
            /* @__PURE__ */ u3("button", { class: "btn btn-primary", onClick: handleCopyToClipboard, children: "\u{1F4CB} Copy" }),
            /* @__PURE__ */ u3("button", { class: "btn btn-primary", onClick: handleDownload, children: "\u{1F4BE} Download" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ u3("aside", { class: "panel settings-panel", children: [
        /* @__PURE__ */ u3("h2", { class: "panel-title", children: "Settings" }),
        /* @__PURE__ */ u3("div", { class: "settings-group", children: [
          /* @__PURE__ */ u3("label", { children: "Output Dimensions" }),
          /* @__PURE__ */ u3("div", { class: "settings-row", children: [
            /* @__PURE__ */ u3("div", { children: [
              /* @__PURE__ */ u3("label", { children: "Width" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "number",
                  min: "1",
                  max: "256",
                  value: state.outputWidth,
                  onChange: (e3) => {
                    const value = parseInt(e3.target.value, 10);
                    if (value > 0 && value <= 256) {
                      setState((prev) => ({ ...prev, outputWidth: value }));
                    }
                  }
                }
              )
            ] }),
            /* @__PURE__ */ u3("div", { children: [
              /* @__PURE__ */ u3("label", { children: "Height" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "number",
                  min: "1",
                  max: "256",
                  value: state.outputHeight,
                  onChange: (e3) => {
                    const value = parseInt(e3.target.value, 10);
                    if (value > 0 && value <= 256) {
                      setState((prev) => ({ ...prev, outputHeight: value }));
                    }
                  }
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ u3("div", { class: "settings-group", children: [
          /* @__PURE__ */ u3("label", { children: "Color Selection Method" }),
          /* @__PURE__ */ u3(
            "select",
            {
              value: state.colorMethod,
              onChange: (e3) => {
                const value = e3.target.value;
                setState((prev) => ({ ...prev, colorMethod: value }));
              },
              children: COLOR_METHODS.map((method) => /* @__PURE__ */ u3("option", { value: method.id, children: method.name }, method.id))
            }
          ),
          /* @__PURE__ */ u3("p", { style: { fontSize: "0.75rem", color: "#888", marginTop: "0.5rem" }, children: COLOR_METHODS.find((m3) => m3.id === state.colorMethod)?.description })
        ] }),
        /* @__PURE__ */ u3("div", { class: "settings-group", children: [
          /* @__PURE__ */ u3("label", { children: "Grid Rotation" }),
          /* @__PURE__ */ u3("div", { class: "rotation-control", children: [
            /* @__PURE__ */ u3(
              "input",
              {
                type: "range",
                min: "-180",
                max: "180",
                value: state.rotation,
                onChange: (e3) => {
                  const value = parseInt(e3.target.value, 10);
                  handleRotationChange(value);
                }
              }
            ),
            /* @__PURE__ */ u3("span", { class: "rotation-value", children: [
              state.rotation,
              "\xB0"
            ] })
          ] }),
          /* @__PURE__ */ u3(
            "button",
            {
              class: "reset-btn",
              style: { marginTop: "0.5rem" },
              onClick: () => handleRotationChange(0),
              children: "Reset Rotation"
            }
          )
        ] }),
        /* @__PURE__ */ u3("div", { class: "settings-group", children: [
          /* @__PURE__ */ u3("label", { children: "Perspective Skew" }),
          /* @__PURE__ */ u3("div", { class: "perspective-controls", children: [
            /* @__PURE__ */ u3("div", { class: "perspective-row", children: [
              /* @__PURE__ */ u3("label", { children: "X Skew" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "range",
                  min: "-10",
                  max: "10",
                  value: state.perspectiveSkewX,
                  onChange: (e3) => {
                    const value = parseInt(e3.target.value, 10);
                    setState((prev) => ({ ...prev, perspectiveSkewX: value }));
                  }
                }
              ),
              /* @__PURE__ */ u3("span", { children: state.perspectiveSkewX })
            ] }),
            /* @__PURE__ */ u3("div", { class: "perspective-row", children: [
              /* @__PURE__ */ u3("label", { children: "Y Skew" }),
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "range",
                  min: "-10",
                  max: "10",
                  value: state.perspectiveSkewY,
                  onChange: (e3) => {
                    const value = parseInt(e3.target.value, 10);
                    setState((prev) => ({ ...prev, perspectiveSkewY: value }));
                  }
                }
              ),
              /* @__PURE__ */ u3("span", { children: state.perspectiveSkewY })
            ] }),
            /* @__PURE__ */ u3("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }, children: [
              /* @__PURE__ */ u3(
                "input",
                {
                  type: "checkbox",
                  id: "isometric",
                  checked: state.isometric,
                  onChange: (e3) => {
                    const checked = e3.target.checked;
                    setState((prev) => ({ ...prev, isometric: checked }));
                  }
                }
              ),
              /* @__PURE__ */ u3("label", { htmlFor: "isometric", style: { fontSize: "0.75rem", color: "#888" }, children: "Isometric Projection (default)" })
            ] }),
            /* @__PURE__ */ u3(
              "button",
              {
                class: "reset-btn",
                onClick: () => setState((prev) => ({
                  ...prev,
                  perspectiveSkewX: 0,
                  perspectiveSkewY: 0
                })),
                children: "Reset Perspective"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
var appElement = document.getElementById("app");
if (appElement) {
  D(/* @__PURE__ */ u3(App, {}), appElement);
}
