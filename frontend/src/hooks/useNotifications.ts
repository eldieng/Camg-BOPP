import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification.service';

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    setIsEnabled(notificationService.isEnabled());
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setIsEnabled(granted);
    return granted;
  }, []);

  const notifyPatientCalled = useCallback((patientName: string, ticketNumber: string, station: string) => {
    if (isEnabled) {
      notificationService.notifyPatientCalled(patientName, ticketNumber, station);
    }
  }, [isEnabled]);

  const notifyNewPatient = useCallback((ticketNumber: string, station: string) => {
    if (isEnabled) {
      notificationService.notifyNewPatient(ticketNumber, station);
    }
  }, [isEnabled]);

  return {
    isSupported,
    isEnabled,
    requestPermission,
    notifyPatientCalled,
    notifyNewPatient,
  };
}

export default useNotifications;
