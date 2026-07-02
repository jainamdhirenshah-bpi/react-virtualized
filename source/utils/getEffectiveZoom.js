/**
 * Helper utility that gives the amount a user has effectively zoomed in or out.
 */
export default function getEffectiveZoom(node) {
  // Chrome 126+ exposes the cumulative effective zoom directly (no style recalc).
  if (typeof node.currentCSSZoom === 'number' && node.currentCSSZoom > 0) {
    return node.currentCSSZoom;
  }
  // Fallback: multiply each ancestor's own CSS `zoom` up to the root.
  var zoom = 1;
  var el = node;
  var win = (node.ownerDocument && node.ownerDocument.defaultView) || window;
  while (el && el.nodeType === 1) {
    var own = parseFloat(win.getComputedStyle(el).zoom);
    if (own && !isNaN(own)) zoom *= own;
    el = el.parentElement;
  }
  return zoom;
}
