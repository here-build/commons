import postcssImport from 'postcss-import';
import postcssCustomSelectors from 'postcss-custom-selectors';
import oklchPlus from '@here.build/postcss-oklch-plus';
import cssnano from 'cssnano';

export default {
  plugins: [
    postcssImport(),
    postcssCustomSelectors(),
    // safe()/safe-hk() lower to plain oklch() — P3 cusp clamp where hue is literal,
    // bell fallback where hue is dynamic (today's case until the per-emphasis bake lands).
    oklchPlus(),
    cssnano({
      preset: ['default', {
        // keep calc() readable — Delta's constraint math uses them heavily
        calc: false,
      }],
    }),
  ],
};
