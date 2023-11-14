import { getExportPathForDependencyWithOptions } from '../exportPath';

describe(getExportPathForDependencyWithOptions, () => {
  it(`returns consistent local path`, () => {
    expect(
      getExportPathForDependencyWithOptions(
        {
          absolutePath:
            '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox/etc/external.tsx',
          data: {
            name: './etc/external',
            data: {
              asyncType: 'async',
              locs: [
                {
                  start: { line: 6, column: 14, index: 104 },
                  end: { line: 6, column: 38, index: 128 },
                },
              ],
              key: 'ABce1CIQXn2ftjEvEp/O1fQ9SzE=',
            },
          },
        }.absolutePath,
        {
          serverRoot: '/Users/evanbacon/Documents/GitHub/expo-router/apps/sandbox',
          platform: 'web',
          src: 'xxx',
        }
      )
    ).toBe('_expo/static/js/web/external-af0af2881d61de928b41386ba16f8115.js');
  });
});
