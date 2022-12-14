// Copyright 2021-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { map, size } from './iterables';

export function getGraphemes(str: string): Iterable<string> {
  const segments = new Intl.Segmenter().segment(str);
  return map(segments, s => s.segment);
}

export function count(str: string): number {
  const segments = new Intl.Segmenter().segment(str);
  return size(segments);
}

export function isSingleGrapheme(str: string): boolean {
  if (str === '') {
    return false;
  }
  const segments = new Intl.Segmenter().segment(str);
  return segments.containing(0).segment === str;
}
