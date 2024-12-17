import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    nitrogen: {
      url: "https://api.nitrogen.fhenix.zone",
      accounts: [process.env.PRIVATE_KEY as string],
    },
  },
};

export default config;
