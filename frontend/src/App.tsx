import React, { useState } from "react";
import { ethers } from "ethers";
import { FhenixClient, EncryptionTypes } from "fhenixjs";
import ConfidentialGradebookABI from "./GradebookABI.json";
import config from "./config";
import "./styles.css";

const teacherAddress = "0xe8b15F7927b78df90CAD21fA78EB7bd9F5664856"; 

const App: React.FC = () => {
  const [teacherView, setTeacherView] = useState<boolean>(true);
  const [studentAddress, setStudentAddress] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [averageGrade, setAverageGrade] = useState<string>("");
  const [myGrade, setMyGrade] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [client, setClient] = useState<FhenixClient | null>(null);

  // Connect Wallet Function
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask or a compatible wallet is required.");
      return;
    }
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setProvider(browserProvider);
      setClient(new FhenixClient({ provider: window.ethereum }));
      setWalletAddress(address);

      console.log("Connected Wallet Address:", address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  // Submit a grade (Teacher View)
  const submitGrade = async () => {
    try {
      if (!provider || !client || !walletAddress) {
        alert("Please connect your wallet first.");
        return;
      
      }
      if (walletAddress.toLowerCase() !== teacherAddress.toLowerCase()) {
        alert("Only the authorized teacher can submit grades.");
        console.error(`Unauthorized Address: ${walletAddress}`);
        return;
      }
      if (!config.contractAddress) {
        throw new Error("Contract address is undefined. Check the .env file.");
      }

      if (!ethers.isAddress(studentAddress)) {
        alert("Invalid student address format.");
        return;
      }
      if (isNaN(Number(grade)) || Number(grade) < 0) {
        alert("Grade must be a valid non-negative number.");
        return;
      }

      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ConfidentialGradebookABI, signer);

      console.log(`Submitting grade for ${studentAddress}...`);
      const encryptedGrade = await client.encrypt(Number(grade), EncryptionTypes.uint32);
      const tx = await contract.submitGrade(studentAddress, encryptedGrade);
      await tx.wait();

      alert("Grade submitted successfully!");
      setStudentAddress("");
      setGrade("");
    } catch (error) {
      console.error("Error submitting grade:", error);
      alert("Failed to submit grade. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch my grade (Student View)
  const fetchMyGrade = async () => {
    try {
      if (!provider || !client || !walletAddress) {
        alert("Please connect your wallet first.");
        return;
      }

      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ConfidentialGradebookABI, signer);

      console.log("Fetching sealed grade...");
      const permission = await client.generatePermit(config.contractAddress);
      const sealedOutput = await contract.viewMyGrade(permission);

      const revealed = await client.unseal(config.contractAddress, sealedOutput, walletAddress);
      setMyGrade(`Your Grade: ${revealed.toString()}`);
    } catch (error) {
      console.error("Error fetching grade:", error);
      alert("Failed to fetch grade. Ensure you have a grade submitted.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch class average grade (Public View)
  const fetchAverageGrade = async () => {
    try {
      if (!provider) {
        alert("Please connect your wallet first.");
        return;
      }

      setLoading(true);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(config.contractAddress, ConfidentialGradebookABI, signer);

      console.log("Fetching class average...");
      const average = await contract.getClassAverage();
      setAverageGrade(`Class Average Grade: ${average.toString()}`);
    } catch (error) {
      console.error("Error fetching average grade:", error);
      alert("Failed to fetch average grade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Confidential Gradebook</h1>

      <div>
        <button onClick={() => setTeacherView(true)}>Teacher View</button>
        <button onClick={() => setTeacherView(false)}>Student/Public View</button>
      </div>

      <div>
        {walletAddress ? (
          <p>Connected Wallet: {walletAddress}</p>
        ) : (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>

      {loading && <p>Loading...</p>}

      {teacherView ? (
        <div className="teacher-view">
          <h2>Teacher View</h2>
          <input
            placeholder="Student Address"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
          />
          <input
            placeholder="Grade"
            type="number"
            min="0"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <button onClick={submitGrade}>Submit Grade</button>
        </div>
      ) : (
        <div className="student-view">
          <h2>Student/Public View</h2>
          <button onClick={fetchMyGrade}>Fetch My Grade</button>
          <p>{myGrade}</p>
          <button onClick={fetchAverageGrade}>Fetch Class Average</button>
          <p>{averageGrade}</p>
        </div>
      )}
    </div>
  );
};

export default App;
