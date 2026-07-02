import getEffectiveZoom from './getEffectiveZoom';

// jsdom implements neither CSS `zoom`, `currentCSSZoom`, nor layout, so we mock
// `currentCSSZoom` (the Chrome 126+ fast path) and stub `getComputedStyle().zoom`
// off each element's `data-zoom` for the ancestor-walk fallback.
describe('getEffectiveZoom', () => {
  let getComputedStyleSpy;

  const mockZoomByDataset = () => {
    getComputedStyleSpy = jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(el => ({
        zoom: (el && el.dataset && el.dataset.zoom) || '1',
      }));
  };

  afterEach(() => {
    if (getComputedStyleSpy) getComputedStyleSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('returns node.currentCSSZoom when present, without walking the tree', () => {
    const el = document.createElement('div');
    el.currentCSSZoom = 0.8;
    mockZoomByDataset();

    expect(getEffectiveZoom(el)).toBe(0.8);
    expect(getComputedStyleSpy).not.toHaveBeenCalled();
  });

  it('falls back to the ancestor walk when currentCSSZoom is unavailable', () => {
    mockZoomByDataset();
    const el = document.createElement('div');
    el.dataset.zoom = '0.8';
    document.body.appendChild(el);

    expect(getEffectiveZoom(el)).toBeCloseTo(0.8);
  });

  it('multiplies zoom up the ancestor chain', () => {
    mockZoomByDataset();
    const grandparent = document.createElement('div');
    grandparent.dataset.zoom = '1.25';
    const parent = document.createElement('div');
    parent.dataset.zoom = '0.8';
    const child = document.createElement('div');
    child.dataset.zoom = '1';
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    expect(getEffectiveZoom(child)).toBeCloseTo(1.0); // 1 * 0.8 * 1.25
  });

  it('returns 1 when nothing in the tree is zoomed', () => {
    mockZoomByDataset();
    const el = document.createElement('div');
    document.body.appendChild(el);

    expect(getEffectiveZoom(el)).toBe(1);
  });

  it('ignores non-numeric zoom values like "normal"', () => {
    mockZoomByDataset();
    const el = document.createElement('div');
    el.dataset.zoom = 'normal';
    document.body.appendChild(el);

    expect(getEffectiveZoom(el)).toBe(1);
  });

  it('falls back to the walk when currentCSSZoom is 0', () => {
    mockZoomByDataset();
    const el = document.createElement('div');
    el.currentCSSZoom = 0;
    el.dataset.zoom = '0.5';
    document.body.appendChild(el);

    expect(getEffectiveZoom(el)).toBeCloseTo(0.5);
  });
});
