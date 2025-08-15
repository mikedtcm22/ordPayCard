import { getLatestChildHeight } from '../latestChildHeight';

describe('getLatestChildHeight (A0 extension)', () => {
  test('returns null when there are no children and caches result', async () => {
    const startMs = 1_000_000;
    const clock = { t: startMs };
    const nowMs = () => clock.t;
    const fetchChildren = jest.fn().mockResolvedValue([]);

    const h1 = await getLatestChildHeight('PARENT_A', { fetchChildren, nowMs });
    expect(h1).toBeNull();
    expect(fetchChildren).toHaveBeenCalledTimes(1);

    // within TTL → cache hit
    clock.t = startMs + 15_000;
    const h2 = await getLatestChildHeight('PARENT_A', { fetchChildren, nowMs });
    expect(h2).toBeNull();
    expect(fetchChildren).toHaveBeenCalledTimes(1);
  });

  test('returns the maximum child height across provided children', async () => {
    const fetchChildren = jest.fn().mockResolvedValue([
      { id: 'c1', height: 100 },
      { id: 'c2', genesis_height: 150 },
      { id: 'c3', height: 140 },
    ]);

    const h = await getLatestChildHeight('PARENT_B', { fetchChildren });
    expect(h).toBe(150);
  });

  test('cache expiry after 30s triggers re-fetch and reflects updated height', async () => {
    const startMs = 2_000_000;
    const clock = { t: startMs };
    const nowMs = () => clock.t;
    const fetchChildren = jest
      .fn()
      .mockResolvedValueOnce([{ height: 200 }])
      .mockResolvedValueOnce([{ height: 220 }]);

    const h1 = await getLatestChildHeight('PARENT_C', { fetchChildren, nowMs });
    expect(h1).toBe(200);
    expect(fetchChildren).toHaveBeenCalledTimes(1);

    clock.t = startMs + 30_000; // TTL boundary
    const h2 = await getLatestChildHeight('PARENT_C', { fetchChildren, nowMs });
    expect(h2).toBe(220);
    expect(fetchChildren).toHaveBeenCalledTimes(2);
  });

  test('dependency error or malformed entries fail closed to null', async () => {
    const fetchChildren = jest.fn().mockRejectedValue(new Error('children error'));
    const h = await getLatestChildHeight('PARENT_D', { fetchChildren });
    expect(h).toBeNull();
  });
});


