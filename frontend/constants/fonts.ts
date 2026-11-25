import { Platform, TextStyle } from 'react-native';

export const Fonts = {
  family: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  headingFamily: Platform.select({
    web: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
};

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: Fonts.headingFamily,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  h2: {
    fontFamily: Fonts.headingFamily,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  h3: {
    fontFamily: Fonts.headingFamily,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  body: {
    fontFamily: Fonts.family,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: Fonts.family,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  caption: {
    fontFamily: Fonts.family,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  button: {
    fontFamily: Fonts.headingFamily,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
};

export default Fonts;
