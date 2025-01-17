import { assert } from 'chai';
import sinon from 'sinon';
import { define, random, array } from 'cooky-cutter';
import { parseISO, subDays, formatISO } from 'date-fns';
import { deletePipeline, filterPipelinesByDate, listPipelines } from '../../src/gitlab';
import { DeleteRequest, GetRequest, Pipeline } from '../../src/network';

const pipeline = define<Pipeline>({
  id: random,
  updated_at: '2020-10-01T15:12:52.710Z',
});

function callListPipelines(getRequest: GetRequest, gitlabUrl = 'https://gitlab.my-domain.io') {
  const projectId = 42;
  const accessToken = 'yBv8';
  const listPipelinesFunction = listPipelines({ getRequest, gitlabUrl, projectId, accessToken });
  return listPipelinesFunction();
}

function callDeletePipeline(deleteRequest: DeleteRequest, gitlabUrl = 'https://gitlab.my-domain.io') {
  const projectId = 42;
  const pipeline: Pipeline = {
    id: 24,
    updated_at: '2020-10-01T20:27:16.768Z',
  };
  const accessToken = 'yBv8';
  const deletePipelineFunction = deletePipeline({ deleteRequest, gitlabUrl, projectId, accessToken });
  return deletePipelineFunction(pipeline);
}

suite('gitlab', function () {
  test('listPipelines() creates the correct API URL', async function () {
    const getRequest = sinon.fake.resolves([]);
    await callListPipelines(getRequest);
    sinon.assert.calledWith(
      getRequest,
      'https://gitlab.my-domain.io/api/v4/projects/42/pipelines?per_page=100',
      sinon.match.string,
    );
  });

  test('listPipelines() creates the correct API URL even when the given GitLab URL has a trailing slash', async function () {
    const getRequest = sinon.fake.resolves([]);
    const gitlabUrl = 'https://gitlab.my-domain.io/';
    await callListPipelines(getRequest, gitlabUrl);
    sinon.assert.calledWith(
      getRequest,
      'https://gitlab.my-domain.io/api/v4/projects/42/pipelines?per_page=100',
      sinon.match.string,
    );
  });

  test('listPipelines() passes the given access token to getRequest() function', async function () {
    const getRequest = sinon.fake.resolves([]);
    await callListPipelines(getRequest);
    sinon.assert.calledWith(getRequest, sinon.match.string, 'yBv8');
  });

  test('filterPipelinesByDate() returns an empty Array when pipelines are empty', function () {
    const startDate = new Date();
    const olderThanDays = 30;
    const actual = filterPipelinesByDate({ pipelines: [], startDate, olderThanDays });
    const expected: Pipeline[] = [];
    assert.deepEqual(actual, expected);
  });

  test('filterPipelinesByDate() returns only pipelines that are older than 30 days', function () {
    const startDate = parseISO('2020-10-01T15:12:52.710Z');
    const olderThanDays = 30;
    pipeline.resetSequence();
    const pipelinesFactory = array(pipeline, 35);
    const pipelines = pipelinesFactory({
      updated_at: (index: number) => formatISO(subDays(startDate, index)),
    });
    const actual = filterPipelinesByDate({ pipelines, startDate, olderThanDays }).map(
      (pipeline) => pipeline.updated_at,
    );
    const expected = [
      '2020-08-31T17:12:52+02:00',
      '2020-08-30T17:12:52+02:00',
      '2020-08-29T17:12:52+02:00',
      '2020-08-28T17:12:52+02:00',
      '2020-08-27T17:12:52+02:00',
    ];
    assert.deepEqual(actual, expected);
  });

  test('filterPipelinesByDate() returns an empty Array when all pipelines are younger than 30 days', function () {
    const startDate = parseISO('2020-10-01T15:12:52.710Z');
    const olderThanDays = 30;
    pipeline.resetSequence();
    const pipelinesFactory = array(pipeline, 15);
    const pipelines = pipelinesFactory({
      updated_at: (index: number) => formatISO(subDays(startDate, index)),
    });
    const actual = filterPipelinesByDate({ pipelines, startDate, olderThanDays });
    const expected: Pipeline[] = [];
    assert.deepEqual(actual, expected);
  });

  test('deletePipeline() creates the correct API URL', async function () {
    const deleteRequest = sinon.fake.resolves('');
    await callDeletePipeline(deleteRequest);
    sinon.assert.calledWith(
      deleteRequest,
      'https://gitlab.my-domain.io/api/v4/projects/42/pipelines/24',
      sinon.match.string,
    );
  });

  test('deletePipeline() creates the correct API URL even when the given GitLab URL has a trailing slash', async function () {
    const deleteRequest = sinon.fake.resolves('');
    const gitlabUrl = 'https://gitlab.my-domain.io/';
    await callDeletePipeline(deleteRequest, gitlabUrl);
    sinon.assert.calledWith(
      deleteRequest,
      'https://gitlab.my-domain.io/api/v4/projects/42/pipelines/24',
      sinon.match.string,
    );
  });

  test('deletePipeline() passes the given access token to deleteRequest() function', async function () {
    const deleteRequest = sinon.fake.resolves('');
    await callDeletePipeline(deleteRequest);
    sinon.assert.calledWith(deleteRequest, sinon.match.string, 'yBv8');
  });
});
