// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import  "@fhenixprotocol/contracts/FHE.sol";
import  "@fhenixprotocol/contracts/access/Permissioned.sol";

contract ConfidentialGradebook is Permissioned {
    address public teacher; // Fixed teacher address

    // Struct to store encrypted grades
    struct StudentGrade {
        bool submitted; // Indicates if the grade has been submitted
        euint32 encryptedGrade; // Encrypted grade
    }

    mapping(address => StudentGrade) private studentGrades; // Grades for each student
    euint32 private totalEncryptedGrades; // Total of all encrypted grades
    euint32 private studentCount; // Encrypted count of students with grades

    constructor(address _teacher) {
        teacher = _teacher; // Set teacher's address at deployment
    }

    // Modifier to ensure only the teacher can submit grades
    modifier onlyTeacher() {
        require(msg.sender == teacher, "Only the teacher can submit grades");
        _;
    }

    // Teacher submits a grade for a student
    function submitGrade(address student, inEuint32 calldata encryptedGrade) public onlyTeacher {
        require(!studentGrades[student].submitted, "Grade already submitted");

        // Store the encrypted grade
        studentGrades[student] = StudentGrade({
            submitted: true,
            encryptedGrade: FHE.asEuint32(encryptedGrade)
        });

        // Update totals for class average
        totalEncryptedGrades = FHE.add(totalEncryptedGrades, FHE.asEuint32(encryptedGrade));
        studentCount = FHE.add(studentCount, FHE.asEuint32(1));
    }

    // Students fetch their own sealed grade
    function viewMyGrade(Permission calldata perm) public view onlySender(perm) returns (string memory) {
        require(studentGrades[msg.sender].submitted, "No grade submitted");
        return FHE.sealoutput(studentGrades[msg.sender].encryptedGrade, perm.publicKey);
    }

    // Public function to get the class average (decrypted for public access)
    function getClassAverage() public view returns (uint32) {
        require(FHE.decrypt(studentCount) > 0, "No grades submitted");

        // Calculate the average
        euint32 average = FHE.div(totalEncryptedGrades, studentCount);
        return FHE.decrypt(average);
    }
}
