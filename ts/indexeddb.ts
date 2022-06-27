// Copyright 2018-2022 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

const LEGACY_DATABASE_ID = 'signal';

export async function doesDatabaseExist(): Promise<boolean> {
  window.SignalContext.log.info(
    'Checking for the existence of IndexedDB data...'
  );
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(LEGACY_DATABASE_ID);

    let existed = true;

    let timer: undefined | ReturnType<typeof setTimeout> = setTimeout(() => {
      window.SignalContext.log.warn(
        'doesDatabaseExist: Timed out attempting to check IndexedDB status'
      );
      return resolve(false);
    }, 1000);

    const clearTimer = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    req.onerror = error => {
      clearTimer();
      reject(error);
    };
    req.onsuccess = () => {
      clearTimer();
      req.result.close();
      resolve(existed);
    };
    req.onupgradeneeded = () => {
      if (req.result.version === 1) {
        existed = false;
        window.indexedDB.deleteDatabase(LEGACY_DATABASE_ID);
      }
    };
  });
}

export function removeDatabase(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    window.SignalContext.log.info(
      `removeDatabase: Deleting IndexedDB database '${LEGACY_DATABASE_ID}'`
    );
    const request = window.indexedDB.deleteDatabase(LEGACY_DATABASE_ID);
    request.onerror = () => {
      window.SignalContext.log.error(
        'removeDatabase: Error deleting database.'
      );
      reject(new Error('Error deleting database'));
    };
    request.onsuccess = () => {
      window.SignalContext.log.info(
        'removeDatabase: Database deleted successfully'
      );
      resolve();
    };
  });
}
