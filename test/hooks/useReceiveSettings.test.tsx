/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectReceiveSettingsUpdated,
  DailyReceiveSettings,
} from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import * as useMeetingStateModule from '../../src/hooks/useMeetingState';
import { useReceiveSettings } from '../../src/hooks/useReceiveSettings';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useReceiveSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns base settings and updateReceiveSettings', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.receiveSettings).toEqual({});
    expect(typeof result.current.updateReceiveSettings).toBe('function');
  });
  it('receive-settings-updated event calls provided callback', async () => {
    const daily = Daily.createCallObject();
    const onReceiveSettingsUpdated = jest.fn();
    renderHook(
      () =>
        useReceiveSettings({
          onReceiveSettingsUpdated,
        }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = mockEvent({
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(onReceiveSettingsUpdated).toHaveBeenCalledWith(payload);
    });
  });
  it('receive-settings-updated event updates returned receiveSettings (base)', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = mockEvent({
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings.base
      );
    });
  });
  it('receive-settings-updated event updates returned receiveSettings (id)', async () => {
    const daily = Daily.createCallObject();
    const id = faker.string.uuid();
    const { result } = renderHook(() => useReceiveSettings({ id }), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = mockEvent({
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
        [id]: {
          video: {
            layer: 1,
          },
        },
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings[id]
      );
    });
  });
  it('returns baseSettings in case id is not set', async () => {
    const daily = Daily.createCallObject();
    const id = faker.string.uuid();
    const { result } = renderHook(() => useReceiveSettings({ id }), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = mockEvent({
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings.base
      );
    });
  });
  it('updateReceiveSettings calls daily.updateReceiveSettings, when meeting state is joined-meeting', async () => {
    const daily = Daily.createCallObject();
    jest
      .spyOn(useMeetingStateModule, 'useMeetingState')
      .mockReturnValue('joined-meeting');

    const { result } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });

    const settings: DailyReceiveSettings = {
      base: {
        video: {
          layer: 1,
        },
      },
    };

    // This needs an await, because updateReceiveSettings mock is async -- the actual function returns a promise.
    // In other words, we need to make sure it resolves correctly otherwise React will complain about the function
    // call not being wrapped inside an act()
    await act(async () => {
      await result.current.updateReceiveSettings(settings);
    });

    await waitFor(() => {
      expect(daily.updateReceiveSettings).toHaveBeenCalledWith(settings);
    });
  });
});
