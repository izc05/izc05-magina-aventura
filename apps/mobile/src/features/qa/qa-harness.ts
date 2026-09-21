import type { RouteDetail } from '@magina-aventura/contracts';
import type { ComponentType } from 'react';

import type { RouteMapRepository } from '../routes/route-map-repository';

export type QaHarnessMode = 'development' | 'qa' | 'production';

export type QaBuildInfo = Readonly<{
  buildType: string;
  commitSha: string;
  version: string;
  workflowRun: string | null;
}>;

export type QaAdventureHarness = Readonly<{
  route: RouteDetail;
  routeMapRepository: RouteMapRepository;
}>;

export type QaTestPositionKey =
  | 'checkpoint1'
  | 'checkpoint2'
  | 'discovery'
  | 'checkpoint3';

/**
 * Resolves a capability, not a user-facing environment label. Unknown values
 * fail closed so TEST DATA cannot be exposed by an accidental release build.
 */
export function resolveQaHarnessMode(
  developmentBuild: boolean,
  qaHarnessFlag: string | undefined,
): QaHarnessMode {
  if (developmentBuild) return 'development';
  return qaHarnessFlag === 'true' ? 'qa' : 'production';
}

export function isQaHarnessEnabledForBuild(
  developmentBuild: boolean,
  qaHarnessFlag: string | undefined,
): boolean {
  return resolveQaHarnessMode(developmentBuild, qaHarnessFlag) !== 'production';
}

// Vitest does not install the React Native __DEV__ global. Metro replaces the
// identifier for Android bundles, leaving this expression compile-time
// evaluable for production while retaining a safe false default in Node.
const developmentBuild = typeof __DEV__ !== 'undefined' && __DEV__;
const qaHarnessBuildEnabled =
  developmentBuild || process.env.EXPO_PUBLIC_ENABLE_QA_HARNESS === 'true';
const qaHarnessMode = resolveQaHarnessMode(
  developmentBuild,
  process.env.EXPO_PUBLIC_ENABLE_QA_HARNESS,
);

/**
 * The condition is compile-time evaluable by Expo. Keep the conditional
 * require inside this file: production bundles must not retain TEST DATA.
 */
export function getQaAdventureHarness(): QaAdventureHarness | null {
  if (!qaHarnessBuildEnabled) return null;

  return require('./qa-adventure-engine-harness').qaAdventureEngineHarness as QaAdventureHarness;
}

export function isQaHarnessEnabled(): boolean {
  return qaHarnessBuildEnabled;
}

export function isQaAdventureRoute(slug: string | undefined): boolean {
  return getQaAdventureHarness()?.route.slug === slug;
}

/**
 * Product builds intentionally have no placeholder route inventory. The
 * existing visual fixtures remain available only to a development server;
 * the standalone QA APK exposes exactly one synthetic adventure instead.
 */
export function getRuntimeRoutes(): RouteDetail[] {
  if (!qaHarnessBuildEnabled) return [];

  const harness = getQaAdventureHarness();
  if (!harness) return [];
  if (qaHarnessMode === 'qa') return [harness.route];

  const developmentRoutes = require('../routes/fixtures').developmentRoutes as RouteDetail[];
  return [...developmentRoutes, harness.route];
}

export function getRuntimeRouteBySlug(slug: string | undefined): RouteDetail | undefined {
  return getRuntimeRoutes().find((route) => route.slug === slug);
}

export function getQaBuildInfo(): QaBuildInfo | null {
  if (!qaHarnessBuildEnabled) return null;

  return {
    buildType:
      process.env.EXPO_PUBLIC_BUILD_TYPE ??
      (qaHarnessMode === 'development' ? 'development' : 'phase4c-qa'),
    commitSha: process.env.EXPO_PUBLIC_GIT_SHA ?? 'local',
    version: process.env.EXPO_PUBLIC_APP_VERSION ?? '0.1.0',
    workflowRun: process.env.EXPO_PUBLIC_CI_RUN_NUMBER ?? null,
  };
}

export function getQaHarnessCard(): ComponentType | null {
  if (!qaHarnessBuildEnabled) return null;

  return require('./QaHarnessCard').QaHarnessCard as ComponentType;
}

export function getQaSimulationPanel(): ComponentType<{
  onEmit(position: QaTestPositionKey): void;
}> | null {
  if (!qaHarnessBuildEnabled) return null;

  return require('./QaSimulationPanel').QaSimulationPanel as ComponentType<{
    onEmit(position: QaTestPositionKey): void;
  }>;
}

/**
 * The simulation implementation is loaded only after the same capability
 * check used to expose the harness. Production builds have no route to it.
 */
export async function emitQaTestPosition(positionKey: QaTestPositionKey): Promise<void> {
  if (!qaHarnessBuildEnabled) return;

  const runtime = require('../../activity/qa-simulation-runtime') as typeof import('../../activity/qa-simulation-runtime');
  await runtime.emitQaTestPosition(positionKey);
}
