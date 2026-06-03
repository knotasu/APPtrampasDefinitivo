import { NativeModules } from 'react-native';

const { ExamLockModule } = NativeModules;

export const startExamLock = () => {
  if (ExamLockModule) {
    ExamLockModule.startExamLock();
  }
};

export const playAlarm = () => {
  if (ExamLockModule) {
    ExamLockModule.playAlarm();
  }
};

export const stopAlarm = () => {
  if (ExamLockModule) {
    ExamLockModule.stopAlarm();
  }
};
