#!/usr/bin/env node
import React from 'react';
import program from 'commander';
import { render } from 'ink';
import { Main } from './Main';
import { getRequest, deleteRequest } from './network';
import { listPipelines, filterPipelinesByDate, deletePipeline } from './gitlab';

function exit() {
  process.exitCode = 1;
}

program
  .name('gitlab-pipeline-deleter')
  .description('Deletes old GitLab pipelines')
  .arguments('<gitlab-url>')
  .arguments('<project-id>')
  .arguments('<access-token>')
  .option('-d --days <days>', 'older than days', '30')
  .action((gitlabUrl: string, projectId: string, accessToken: string) => {
    const parsedProjectId = parseInt(projectId, 10);
    const days = parseInt(program.days, 10);
    const startDate = new Date();
    const listPipelinesFunction = listPipelines({ getRequest, gitlabUrl, projectId: parsedProjectId, accessToken });
    const deletePipelineFunction = deletePipeline({
      deleteRequest,
      gitlabUrl,
      projectId: parsedProjectId,
      accessToken,
    });
    render(
      <Main
        gitlabUrl={gitlabUrl}
        projectId={parsedProjectId}
        accessToken={accessToken}
        days={days}
        startDate={startDate}
        exit={exit}
        listPipelines={listPipelinesFunction}
        filterPipelinesByDate={filterPipelinesByDate}
        deletePipeline={deletePipelineFunction}
      />,
    );
  });

program.parse(process.argv);
