import { Connection } from 'mongoose';
import { lotMock } from '#test/mocks/entities/lot.mock';
import { getAuthorizationToken } from '#test/helpers/getAuthorizationToken';
import { TestCore } from '#test/config/test-core';
import { TestCoreBuilder } from '#test/config/test-core-builder';
import { LotsModule } from '#app-root/lots/lots.module';
import { SuperTest } from 'supertest';
import { userMock } from '#test/mocks/entities/user.mock';

describe('LotsController', () => {
  let testCore: TestCore;
  let dbConnection: Connection;
  let request: SuperTest<any>;
  let authorizationToken: string;

  const lotData = lotMock();

  beforeAll(async () => {
    testCore = await TestCoreBuilder.init(LotsModule).build();

    request = testCore.httpRequest;
    dbConnection = testCore.dbConnection;
    authorizationToken = await getAuthorizationToken(testCore);
  });

  afterAll(async () => {
    await testCore.closeApp();
  });

  beforeEach(async () => {
    await dbConnection.collection('users').deleteMany({});
    await dbConnection.collection('lots').deleteMany({});
  });

  describe('findAll', () => {
    describe('when success', () => {
      const user = userMock();

      beforeEach(async () => {
        const lots = [lotMock(), lotMock(), lotMock(user), lotMock(user)];
        await dbConnection.collection('lots').insertMany(lots);
      });

      it('should be return all lots', async () => {
        const response = await request
          .get('/api/lots')
          .set('Authorization', `Bearer ${authorizationToken}`);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(4);
      });

      // it('should be return own lots', async () => {
      //   authorizationToken = await getAuthorizationToken(testCore, user);
      //   const ownQuery = '?own=true';
      //
      //   const response = await request
      //     .get(`/api/lots${ownQuery}`)
      //     .set('Authorization', `Bearer ${authorizationToken}`);
      //
      //   expect(response.status).toBe(200);
      //   expect(response.body.length).toBe(2);
      // });
    });

    describe('when errors', () => {
      describe('when Unauthorized', () => {
        it('should be status 401', async () => {
          const response = await request.get('/api/lots');

          expect(response.status).toBe(401);
        });
      });
    });
  });

  describe('create', () => {
    describe('when success', () => {
      it('should be create lot', async () => {
        const response = await request
          .post('/api/lots')
          .send(lotData)
          .set('Authorization', `Bearer ${authorizationToken}`);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe(lotData.title);
      });
    });

    describe('when errors', () => {
      describe('when Unauthorized', () => {
        it('should be status 401', async () => {
          const response = await request.post('/api/lots').send(lotData);

          expect(response.status).toBe(401);
        });
      });

      describe('when title not present', () => {
        it('should be create lot', async () => {
          lotData.title = '';

          const response = await request
            .post('/api/lots')
            .send(lotData)
            .set('Authorization', `Bearer ${authorizationToken}`);

          expect(response.status).toBe(400);
          expect(response.body.message).toStrictEqual([
            'title should not be empty',
          ]);
        });
      });
    });
  });

  describe('findOne', () => {
    beforeEach(async () => {
      await dbConnection.collection('lots').insertOne(lotData);
    });

    describe('when success', () => {
      it('should be create lot', async () => {
        const requestOnFindAll = await request
          .get('/api/lots')
          .set('Authorization', `Bearer ${authorizationToken}`);
        const lotID = requestOnFindAll.body[0]._id;
        const response = await request
          .get(`/api/lots/${lotID}`)
          .set('Authorization', `Bearer ${authorizationToken}`);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(lotData.title);
      });
    });

    describe('when errors', () => {
      describe('when Unauthorized', () => {
        it('should be status 401', async () => {
          const response = await request.post('/api/lots').send(lotData);

          expect(response.status).toBe(401);
        });
      });

      describe('when lot not found', () => {
        it('should be create lot', async () => {
          const response = await request
            .get(`/api/lots/some_lot_ID`)
            .set('Authorization', `Bearer ${authorizationToken}`);

          expect(response.status).toBe(404);
          expect(response.body.message).toBe('Not Found');
        });
      });
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await dbConnection.collection('lots').insertOne(lotData);
    });

    describe('when success', () => {
      it('should be create lot', async () => {
        const requestOnFindAll = await request
          .get('/api/lots')
          .set('Authorization', `Bearer ${authorizationToken}`);
        const lotID = requestOnFindAll.body[0]._id;
        const lotParams = { title: 'new title' };
        const response = await request
          .patch(`/api/lots/${lotID}`)
          .send(lotParams)
          .set('Authorization', `Bearer ${authorizationToken}`);

        expect(response.status).toBe(200);
        expect(response.body.title).toBe(lotParams.title);
      });
    });

    describe('when errors', () => {
      describe('when Unauthorized', () => {
        it('should be status 401', async () => {
          const response = await request
            .patch(`/api/lots/some_lotID`)
            .send(lotData);

          expect(response.status).toBe(401);
        });
      });

      describe('when lot not found', () => {
        it('should be create lot', async () => {
          const response = await request
            .patch(`/api/lots/some_lot_ID`)
            .set('Authorization', `Bearer ${authorizationToken}`);

          expect(response.status).toBe(404);
          expect(response.body.message).toBe('Not Found');
        });
      });

      describe('when title not present', () => {
        it('should be create lot', async () => {
          const requestOnFindAll = await request
            .get('/api/lots')
            .set('Authorization', `Bearer ${authorizationToken}`);
          const lotID = requestOnFindAll.body[0]._id;
          const lotParams = { title: '' };
          const response = await request
            .patch(`/api/lots/${lotID}`)
            .send(lotParams)
            .set('Authorization', `Bearer ${authorizationToken}`);

          expect(response.status).toBe(400);
          expect(response.body.message).toStrictEqual([
            'title should not be empty',
          ]);
        });
      });
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      await dbConnection.collection('lots').insertOne(lotData);
    });

    describe('when success', () => {
      it('should be create lot', async () => {
        const requestOnFindAll = await request
          .get('/api/lots')
          .set('Authorization', `Bearer ${authorizationToken}`);
        const lotID = requestOnFindAll.body[0]._id;
        const response = await request
          .delete(`/api/lots/${lotID}`)
          .set('Authorization', `Bearer ${authorizationToken}`);

        expect(response.status).toBe(204);
      });
    });

    describe('when errors', () => {
      describe('when Unauthorized', () => {
        it('should be status 401', async () => {
          const response = await request.delete(`/api/lots/some_lotID}`);

          expect(response.status).toBe(401);
        });
      });

      describe('when lot not found', () => {
        it('should be create lot', async () => {
          const response = await request
            .delete(`/api/lots/some_lot_ID`)
            .set('Authorization', `Bearer ${authorizationToken}`);

          expect(response.status).toBe(404);
          expect(response.body.message).toBe('Not Found');
        });
      });
    });
  });
});
