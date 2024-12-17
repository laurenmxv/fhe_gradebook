import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ConfidentialGradebookModule", (m) => {
  const teacherAddress = m.getParameter("teacherAddress", "0xe8b15F7927b78df90CAD21fA78EB7bd9F5664856");

  const confidentialGradebook = m.contract("ConfidentialGradebook", [teacherAddress]);

  return { confidentialGradebook };
});
