export type RouteMapLayoutMode = 'embedded' | 'screen';

export type RouteMapLayout = Readonly<{
  height: number;
  margin: number;
  borderRadius: number;
  noticeInset: number;
}>;

const layouts: Record<RouteMapLayoutMode, RouteMapLayout> = {
  embedded: {
    height: 260,
    margin: 20,
    borderRadius: 24,
    noticeInset: 12,
  },
  screen: {
    height: 430,
    margin: 0,
    borderRadius: 0,
    noticeInset: 20,
  },
};

export function getRouteMapLayout(mode: RouteMapLayoutMode): RouteMapLayout {
  return layouts[mode];
}
