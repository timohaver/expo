import assert from 'assert';

import { microBundle, projectRoot } from '../fork/__tests__/mini-metro';
import {
  createSerializerFromSerialProcessors,
  withSerializerPlugins,
} from '../withExpoSerializers';

describe(withSerializerPlugins, () => {
  it(`executes in the expected order`, async () => {
    const customSerializer = jest.fn();

    const customProcessor = jest.fn((...res) => res);

    const config = withSerializerPlugins(
      {
        serializer: {
          customSerializer,
        },
      },
      [customProcessor as any]
    );

    const options = {
      sourceUrl: 'https://localhost:8081/index.bundle?platform=ios&dev=true&minify=false',
    };
    // @ts-expect-error
    await config.serializer.customSerializer('a', 'b', 'c', options);

    expect(customProcessor).toBeCalledWith('a', 'b', 'c', options);
    expect(customSerializer).toBeCalledWith('a', 'b', 'c', options);
  });
});

describe('serializes', () => {
  it(`passes sanity`, async () => {
    const serializer = createSerializerFromSerialProcessors(
      {
        projectRoot,
      },
      []
    );

    const fs = {
      'index.js': `
        import { foo } from './foo';
        console.log(foo);
      `,
      'foo.js': `
        export const foo = 'foo';
      `,
    };

    expect(await serializer(...microBundle({ fs }))).toMatchInlineSnapshot(`
      "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        var foo = _$$_REQUIRE(dependencyMap[0], "./foo").foo;
        console.log(foo);
      },"/app/index.js",["/app/foo.js"],"index.js");
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
      },"/app/foo.js",[],"foo.js");
      TEST_RUN_MODULE("/app/index.js");"
    `);
  });

  async function doSplit(fs: Record<string, string>) {
    const serializer = createSerializerFromSerialProcessors(
      {
        projectRoot,
      },
      []
    );

    const serialParams = microBundle({
      fs,
      options: { platform: 'web', dev: false, output: 'static' },
    });

    const output = (await serializer(...serialParams)) as any;
    assert('artifacts' in output && Array.isArray(output.artifacts));

    return output.artifacts;
  }
  it(`bundle splits an async import`, async () => {
    const artifacts = await doSplit({
      'index.js': `
          import('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-0b9b43ecdb3c710f64dda45d7d0db4cd.js",
        "_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-0b9b43ecdb3c710f64dda45d7d0db4cd.js",
          "metadata": {
            "isAsync": false,
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/index.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js"}});
      TEST_RUN_MODULE("/app/index.js");
      //# sourceMappingURL=index.map",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js",
          "metadata": {
            "isAsync": true,
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
      },"/app/foo.js",[]);
      //# sourceMappingURL=foo.map",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(2);
    expect(artifacts[1].metadata).toEqual({ isAsync: true, requires: [] });
  });

  it(`imports async bundles in second module`, async () => {
    const artifacts = await doSplit({
      'index.js': `
          import "./two"
        `,
      'two.js': `
          import('./foo')
        `,
      'foo.js': `
          export const foo = 'foo';
        `,
    });

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-904a90a53c6490313e6bce0f78f03fa8.js",
        "_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-904a90a53c6490313e6bce0f78f03fa8.js",
          "metadata": {
            "isAsync": false,
            "requires": [],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[0], "./two");
      },"/app/index.js",["/app/two.js"]);
      __d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./foo");
      },"/app/two.js",{"0":"/app/foo.js","1":"/app/node_modules/expo-mock/async-require/index.js","paths":{"/app/foo.js":"/_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js"}});
      TEST_RUN_MODULE("/app/index.js");
      //# sourceMappingURL=index.map",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/foo-232b89d35f31c36feae2c10429b845f0.js",
          "metadata": {
            "isAsync": true,
            "requires": [],
          },
          "originFilename": "foo.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const foo = 'foo';
        exports.foo = foo;
      },"/app/foo.js",[]);
      //# sourceMappingURL=foo.map",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(2);
    expect(artifacts[1].metadata).toEqual({ isAsync: true, requires: [] });
  });

  it(`dedupes shared module in async imports`, async () => {
    const artifacts = await doSplit({
      'index.js': `
          import('./math');
          import('./shapes');
        `,
      'math.js': `
        import './colors';
          export const add = 'add';
        `,
      'shapes.js': `
      import './colors';
          export const square = 'square';
        `,
      'colors.js': `
          export const orange = 'orange';
        `,
    });

    expect(artifacts.map((art) => art.filename)).toMatchInlineSnapshot(`
      [
        "_expo/static/js/web/index-833b20aeb77cc593674361f73b066ac3.js",
        "_expo/static/js/web/math-b70acfe62bcee9c14849d23d1d5d35ff.js",
        "_expo/static/js/web/shapes-d1c59c3d9c2577a2efe2e98e1e3acf65.js",
        "_expo/static/js/web/colors-8b2ec726ca43b2f43070a8f845cd4ef9.js",
      ]
    `);

    expect(artifacts).toMatchInlineSnapshot(`
      [
        {
          "filename": "_expo/static/js/web/index-833b20aeb77cc593674361f73b066ac3.js",
          "metadata": {
            "isAsync": false,
            "requires": [
              "_expo/static/js/web/colors-8b2ec726ca43b2f43070a8f845cd4ef9.js",
            ],
          },
          "originFilename": "index.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[0], dependencyMap.paths, "./math");
        _$$_REQUIRE(dependencyMap[1], "expo-mock/async-require")(dependencyMap[2], dependencyMap.paths, "./shapes");
      },"/app/index.js",{"0":"/app/math.js","1":"/app/node_modules/expo-mock/async-require/index.js","2":"/app/shapes.js","paths":{"/app/math.js":"/_expo/static/js/web/math-b70acfe62bcee9c14849d23d1d5d35ff.js","/app/shapes.js":"/_expo/static/js/web/shapes-d1c59c3d9c2577a2efe2e98e1e3acf65.js"}});
      TEST_RUN_MODULE("/app/index.js");
      //# sourceMappingURL=index.map",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/math-b70acfe62bcee9c14849d23d1d5d35ff.js",
          "metadata": {
            "isAsync": true,
            "requires": [],
          },
          "originFilename": "math.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(dependencyMap[0], "./colors");
        const add = 'add';
        exports.add = add;
      },"/app/math.js",["/app/colors.js"]);
      //# sourceMappingURL=math.map",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/shapes-d1c59c3d9c2577a2efe2e98e1e3acf65.js",
          "metadata": {
            "isAsync": true,
            "requires": [],
          },
          "originFilename": "shapes.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        _$$_REQUIRE(dependencyMap[0], "./colors");
        const square = 'square';
        exports.square = square;
      },"/app/shapes.js",["/app/colors.js"]);
      //# sourceMappingURL=shapes.map",
          "type": "js",
        },
        {
          "filename": "_expo/static/js/web/colors-8b2ec726ca43b2f43070a8f845cd4ef9.js",
          "metadata": {
            "isAsync": false,
            "requires": [],
          },
          "originFilename": "colors.js",
          "source": "__d(function (global, _$$_REQUIRE, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, dependencyMap) {
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
        const orange = 'orange';
        exports.orange = orange;
      },"/app/colors.js",[]);
      //# sourceMappingURL=colors.map",
          "type": "js",
        },
      ]
    `);

    // Split bundle
    expect(artifacts.length).toBe(4);
    expect(artifacts[1].metadata).toEqual({ isAsync: true, requires: [] });
    expect(artifacts[2].metadata).toEqual({ isAsync: true, requires: [] });

    // The shared sync import is deduped and added to a common chunk.
    // This will be loaded in the index.html before the other bundles.
    expect(artifacts[3].filename).toEqual(
      expect.stringMatching(/_expo\/static\/js\/web\/colors-.*\.js/)
    );
    expect(artifacts[3].metadata).toEqual({ isAsync: false, requires: [] });
    // Ensure the dedupe chunk isn't run, just loaded.
    expect(artifacts[3].source).not.toMatch(/TEST_RUN_MODULE/);
  });
});
