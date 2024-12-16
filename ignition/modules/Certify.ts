// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CertifyModule = buildModule("CertifyModule", (m) => {
  const certify = m.contract("Certify", ["Saujana Shafi"]);

  return { certify };
});

export default CertifyModule;
