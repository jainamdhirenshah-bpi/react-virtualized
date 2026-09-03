"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _getEffectiveZoom = _interopRequireDefault(require("./getEffectiveZoom"));
// jsdom implements neither CSS `zoom`, `currentCSSZoom`, nor layout, so we mock
// `currentCSSZoom` (the Chrome 126+ fast path) and stub `getComputedStyle().zoom`
// off each element's `data-zoom` for the ancestor-walk fallback.
describe('getEffectiveZoom', function () {
  var getComputedStyleSpy;
  var mockZoomByDataset = function mockZoomByDataset() {
    getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle').mockImplementation(function (el) {
      return {
        zoom: el && el.dataset && el.dataset.zoom || '1'
      };
    });
  };
  afterEach(function () {
    if (getComputedStyleSpy) getComputedStyleSpy.mockRestore();
    document.body.innerHTML = '';
  });
  it('returns node.currentCSSZoom when present, without walking the tree', function () {
    var el = document.createElement('div');
    el.currentCSSZoom = 0.8;
    mockZoomByDataset();
    expect((0, _getEffectiveZoom["default"])(el)).toBe(0.8);
    expect(getComputedStyleSpy).not.toHaveBeenCalled();
  });
  it('falls back to the ancestor walk when currentCSSZoom is unavailable', function () {
    mockZoomByDataset();
    var el = document.createElement('div');
    el.dataset.zoom = '0.8';
    document.body.appendChild(el);
    expect((0, _getEffectiveZoom["default"])(el)).toBeCloseTo(0.8);
  });
  it('multiplies zoom up the ancestor chain', function () {
    mockZoomByDataset();
    var grandparent = document.createElement('div');
    grandparent.dataset.zoom = '1.25';
    var parent = document.createElement('div');
    parent.dataset.zoom = '0.8';
    var child = document.createElement('div');
    child.dataset.zoom = '1';
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);
    expect((0, _getEffectiveZoom["default"])(child)).toBeCloseTo(1.0); // 1 * 0.8 * 1.25
  });
  it('returns 1 when nothing in the tree is zoomed', function () {
    mockZoomByDataset();
    var el = document.createElement('div');
    document.body.appendChild(el);
    expect((0, _getEffectiveZoom["default"])(el)).toBe(1);
  });
  it('ignores non-numeric zoom values like "normal"', function () {
    mockZoomByDataset();
    var el = document.createElement('div');
    el.dataset.zoom = 'normal';
    document.body.appendChild(el);
    expect((0, _getEffectiveZoom["default"])(el)).toBe(1);
  });
  it('falls back to the walk when currentCSSZoom is 0', function () {
    mockZoomByDataset();
    var el = document.createElement('div');
    el.currentCSSZoom = 0;
    el.dataset.zoom = '0.5';
    document.body.appendChild(el);
    expect((0, _getEffectiveZoom["default"])(el)).toBeCloseTo(0.5);
  });
});