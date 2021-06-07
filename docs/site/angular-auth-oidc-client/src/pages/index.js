import { Redirect } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import React from 'react';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return <Redirect to={siteConfig.customFields.redirectOnStart} />;
}
