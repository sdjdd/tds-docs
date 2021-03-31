import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { DC_DOMAIN_HOST, MAIN_DOMAIN_HOST } from "../../constants/env";
import styles from './styles.module.scss';
import Translate from '@docusaurus/Translate';

type LogoProp = {
  noLabel?: boolean;
  onClick?: () => any;
};

const Logo = ({ noLabel, onClick }: LogoProp) => {
  return <div className={styles.logoContainer} onClick={onClick}>
    <a className={styles.logoImage} href={MAIN_DOMAIN_HOST}>
      <img src={useBaseUrl('img/logo.svg')} alt="TapTap" />
    </a>
    {!noLabel && <div className={styles.divider} />}
    {!noLabel && <a className={styles.label} href={DC_DOMAIN_HOST}>
      <Translate id="tds-header-开发者中心" description="from Header">
        开发者中心
      </Translate>
    </a>}
  </div>;
};

export default Logo;