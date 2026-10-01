import type { ImageSourcePropType } from 'react-native';

export interface CommonsContextPhoto {
  id: string;
  fileName: string;
  source: ImageSourcePropType;
  sourcePageUrl: string;
  accessibilityLabel: string;
  author: string;
}

export const CC_BY_SA_4_0_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

export const commonsContextPhotos: readonly CommonsContextPhoto[] = [
  {
    id: 'rio-cuadros-jaen1',
    fileName: 'Rio Cuadros Jaen1.JPG',
    source: require('../../../assets/commons/Rio_Cuadros_Jaen1.jpg'),
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen1.JPG',
    accessibilityLabel: 'Cueva del Agua del río Cuadros, fotografía de 2014. No muestra el trazado del sendero fluvial nuevo.',
    author: 'Veinticuatro de Jahén',
  },
  {
    id: 'rio-cuadros-jaen2',
    fileName: 'Rio Cuadros Jaen2.JPG',
    source: require('../../../assets/commons/Rio_Cuadros_Jaen2.jpg'),
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Rio_Cuadros_Jaen2.JPG',
    accessibilityLabel: 'Cueva del Agua del río Cuadros, fotografía de 2014. No muestra el trazado del sendero fluvial nuevo.',
    author: 'Veinticuatro de Jahén',
  },
];
