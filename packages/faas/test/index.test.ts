import { join } from 'path';
import * as assert from 'assert';
import * as mm from 'mm';
import { creatStarter, closeApp } from './utils';
import { Framework } from '../src';

describe('test/index.test.ts', () => {

  it('invoke handler by default name', async () => {
    const starter = await creatStarter('base-app');
    const data = await starter.handleInvokeWrapper('index.handler')(
      {
        text: 'hello',
      },
      { text: 'a' }
    );
    expect(data).toEqual('ahello');
  });

  it('invoke different handler use @Handler', async () => {
    const starter = await creatStarter('base-app-handler');
    assert(
      (await starter.handleInvokeWrapper('index.entry')(
        {
          text: 'hello',
        },
        { text: 'a' }
      )) === 'ahello'
    );
    assert(
      (await starter.handleInvokeWrapper('index.list')(
        {
          text: 'hello',
        },
        { text: 'a' }
      )) === 'ahello'
    );
    await closeApp(starter);
  });

  it('use default handler and new handler', async () => {
    const starter = await creatStarter('base-app-handler2');
    assert(
      (await starter.handleInvokeWrapper('index.handler')(
        {
          text: 'hello',
        },
        { text: 'a' }
      )) === 'defaultahello'
    );
    assert(
      (await starter.handleInvokeWrapper('index.list')(
        {
          text: 'hello',
        },
        { text: 'ab' }
      )) === 'abhello'
    );
    assert(
      (await starter.handleInvokeWrapper('indexService.get')({}, {})) ===
        'hello'
    );
    await closeApp(starter);
  });

  it('invoke handler by another name', async () => {
    const starter = await creatStarter('base-app-route');
    const data = await starter.handleInvokeWrapper('deploy.handler9')(
      {
        text: 'hello',
      },
      { text: 'ab' }
    );
    assert(data === 'abhello');
    await closeApp(starter);
  });

  // it('use simple lock start should exec only once', async () => {
  //   const starter = await creatApp('base-app');
  //
  //   let i = 0;
  //   const cb = async () => {
  //     i++;
  //   };
  //   const arr = [starter.start({ cb }), starter.start({ cb }), starter.start({ cb })];
  //   await Promise.all(arr);
  //   assert(1 === i);
  //   await closeApp(starter);
  // });

  it('use new decorator and use function middleware', async () => {
    const starter = await creatStarter('base-app-new');
    const data = await starter.handleInvokeWrapper('index.handler')(
      {
        text: 'hello',
      },
      { text: 'ab' }
    );
    assert(data === 'abhello');
    await closeApp(starter);
  });

  it('configuration test should be ok', async () => {
    mm(process.env, 'NODE_ENV', '');
    class TestFaaSStarter extends Framework {
      prepareConfiguration() {
        this.initConfiguration(
          join(__dirname, './configuration'),
          join(__dirname, 'fixtures/midway-plugin-mod')
        );
      }
    }
    const starter = await creatStarter('base-app-configuration', {}, TestFaaSStarter);
    const data = await starter.handleInvokeWrapper('index.handler')(
      {},
      { text: 'ab' }
    );
    assert(data === '5321abone articlereplace managerprod');
    mm.restore();
    await closeApp(starter);
  });

  it('test custom global middleware in fc', async () => {
    mm(process.env, 'MIDWAY_SERVERLESS_FUNCTION_NAME',  'aaa');
    mm(process.env, 'MIDWAY_SERVERLESS_SERVICE_NAME',  'bbb');
    const { start } = require('@midwayjs/serverless-fc-starter');
    const runtime = await start();
    const starter = await creatStarter('base-app-middleware', {
      applicationAdapter: runtime,
    });

    const data = await runtime.asyncEvent(
      starter.handleInvokeWrapper('index.handler')
    )(
      {
        text: 'hello',
        httpMethod: 'GET',
        headers: {},
        requestContext: {},
        queryParameters: {},
      },
      { text: 'a' }
    );

    expect(data.body).toEqual('ahello555aaabbb');
    await closeApp(starter);
    mm.restore();
  });

  it('test custom global middleware in scf', async () => {
    const { start } = require('@midwayjs/serverless-scf-starter');
    const runtime = await start();
    const starter = await creatStarter('base-app-middleware-scf', {
      applicationAdapter: runtime,
    });

    const data = await runtime.asyncEvent(
      starter.handleInvokeWrapper('index.handler')
    )(
      {
        text: 'hello',
        httpMethod: 'GET',
        headers: {},
        requestContext: {},
      },
      { text: 'a' }
    );

    assert(data.body === 'ahello555');
    await closeApp(starter);
  });

  it('test throw error from code and middleware catch it', async () => {
    const { start } = require('@midwayjs/serverless-scf-starter');
    const runtime = await start();

    const starter = await creatStarter('base-app-middleware-err', {
      applicationAdapter: runtime,
    });
    const data = await runtime.asyncEvent(
      starter.handleInvokeWrapper('index.handler')
    )(
      {
        text: 'hello',
        httpMethod: 'GET',
        headers: {},
        requestContext: {},
      },
      { text: 'a' }
    );

    assert(data.body === 'ahello555');
    await closeApp(starter);
  });

  it('test inject app and plugin', async () => {
    const { start } = require('@midwayjs/serverless-scf-starter');
    const runtime = await start();
    const starter = await creatStarter('base-app-inject', {
      applicationAdapter: runtime,
    });
    // set app
    const app = runtime.getApplication();
    app.mysql = {
      model: '123',
    };
    const data = await runtime.asyncEvent(
      starter.handleInvokeWrapper('index.handler')
    )(
      {
        text: 'hello',
        httpMethod: 'GET',
        headers: {},
        requestContext: {},
      },
      { text: 'a' }
    );

    assert(data.body === 'ahello123');
    await closeApp(starter);
  });

  it('test inject logger', async () => {
    const { start } = require('@midwayjs/serverless-scf-starter');
    const runtime = await start();
    const starter = await creatStarter('base-app-inject-logger', {
      applicationAdapter: runtime,
    });

    const data = await runtime.asyncEvent(
      starter.handleInvokeWrapper('index.handler')
    )(
      {
        text: 'hello',
        httpMethod: 'GET',
        headers: {},
        requestContext: {},
      },
      { text: 'a' }
    );

    assert(data.body === 'hello world');
    await closeApp(starter);
  });

  it('test midway-hooks', async () => {
    mm(process.env, 'NODE_ENV', 'sh');
    const starter = await creatStarter('midway-hooks');
    const data1 = await starter.handleInvokeWrapper('index.handler')({}, {});
    const data2 = await starter.handleInvokeWrapper('inject.handler')({}, {});

    assert(data1);
    assert(data2);

    const config = await starter.handleInvokeWrapper('config.handler')({}, {});
    const applicationContext = starter.getApplicationContext();
    const value = applicationContext.getConfigService().getConfiguration('env');

    assert(config === value);

    const loggerExist = await starter.handleInvokeWrapper('logger.handler')(
      {},
      {}
    );
    assert(loggerExist);
    await closeApp(starter);
  });

  it('invoke controller handler', async () => {
    const starter = await creatStarter('base-app-controller');
    let data = await starter.handleInvokeWrapper('index.handler')(
      {
        text: 'hello',
      },
      { text: 'a' }
    );
    expect(data).toEqual('ahello');

    let ctx = {
      text: 'hello',
      httpMethod: 'GET',
      headers: {},
      set(key, value) {
        ctx.headers[key] = value;
      }
    }

    data = await starter.handleInvokeWrapper('apiController.homeSet')(
      ctx,
      { text: 'a' }
    );
    expect(data).toEqual('bbb');
    expect(ctx.headers['ccc']).toEqual('ddd');
    expect(ctx.headers['bbb']).toEqual('aaa');
  });
});
