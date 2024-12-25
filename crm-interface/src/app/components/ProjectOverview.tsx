'use client'; // Mark this as a client-side component

import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_PROJECT_OVERVIEW = gql`
  query {
    projectOverview {
      projectNumber
      projectName
      totalServicesSelected
      servicesCompleted
      openServices
      percentCompleted
    }
  }
`;

const ProjectOverview = () => {
  const { loading, error, data } = useQuery(GET_PROJECT_OVERVIEW);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Project Overview</h2>
      <ul>
        {data.projectOverview.map((project: any) => (
          <li key={project.projectNumber}>
            {project.projectName} - {project.percentCompleted}%
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectOverview;