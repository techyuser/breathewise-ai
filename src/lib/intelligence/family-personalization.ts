export interface PersonalizedThresholds {
  pm25Limit: number;
  aqiLimit: number;
  description: string;
}

export type SensitivityGroup = 'infant' | 'elderly' | 'respiratory' | 'pregnant' | 'pet' | 'general';

/**
 * Returns customized air quality thresholds for different family cohorts.
 */
export function getFamilyThresholds(group: SensitivityGroup, lang: 'en' | 'hi' = 'en'): PersonalizedThresholds {
  const thresholds: Record<SensitivityGroup, PersonalizedThresholds> = {
    infant: {
      pm25Limit: 10,
      aqiLimit: 50,
      description: lang === 'hi' ? "शिशुओं की सांस लेने की दर तेज होती है। उनके लिए PM2.5 सीमा 10µg/m³ रखी गई है।" : "Infants breathe faster relative to body weight. Limit set to 10µg/m³ PM2.5."
    },
    elderly: {
      pm25Limit: 15,
      aqiLimit: 75,
      description: lang === 'hi' ? "हृदय संबंधी संवेदनशीलता के कारण सख्त निगरानी की आवश्यकता है।" : "Strict monitoring required due to potential cardiovascular sensitivity."
    },
    respiratory: {
      pm25Limit: 12,
      aqiLimit: 60,
      description: lang === 'hi' ? "अस्थमा/COPD के लिए उन्नत चेतावनी सीमा।" : "Advanced warning threshold for Asthma/COPD profiles."
    },
    pregnant: {
      pm25Limit: 15,
      aqiLimit: 80,
      description: lang === 'hi' ? "भ्रूण के विकास की सुरक्षा के लिए सावधानी।" : "Precautionary limit to protect fetal development."
    },
    pet: {
      pm25Limit: 25,
      aqiLimit: 100,
      description: lang === 'hi' ? "पालतू जानवर ज़मीन के पास प्रदूषकों के प्रति संवेदनशील होते हैं।" : "Pets are sensitive to ground-level pollutants and smog."
    },
    general: {
      pm25Limit: 35,
      aqiLimit: 100,
      description: lang === 'hi' ? "सामान्य वयस्क स्वास्थ्य दिशानिर्देश।" : "Standard adult health guidelines."
    }
  };

  return thresholds[group] || thresholds.general;
}
