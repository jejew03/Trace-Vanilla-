// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VanillaTrace {

    enum Role { NONE, FARMER, DRYER, EXPORTER, IMPORTER, ADMIN }
    enum Step { HARVEST, DRYING, PACKAGING, EXPORT, IMPORT }

    struct StepAttestation {
        uint256 timestamp;
        address actor;
        bytes32 eventHash;
        Step step;
    }

    address public owner;
    mapping(address => Role) public roles;
    mapping(bytes32 => StepAttestation[]) public attestations;

    // Étapes autorisées par rôle
    mapping(Role => mapping(Step => bool)) public stepAllowed;

    event RoleSet(address indexed actor, Role role);
    event StepAttested(bytes32 indexed lotRef, Step step, address actor, bytes32 eventHash);

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.ADMIN, "Not admin");
        _;
    }

    modifier onlyRole(Role required) {
        require(roles[msg.sender] == required, "Wrong role");
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.ADMIN;
        // Init des permissions
        stepAllowed[Role.FARMER][Step.HARVEST] = true;
        stepAllowed[Role.DRYER][Step.DRYING] = true;
        stepAllowed[Role.EXPORTER][Step.PACKAGING] = true;
        stepAllowed[Role.EXPORTER][Step.EXPORT] = true;
        stepAllowed[Role.IMPORTER][Step.IMPORT] = true;
    }

    function setRole(address actor, Role role) external onlyAdmin {
        roles[actor] = role;
        emit RoleSet(actor, role);
    }

    function attestStep(bytes32 lotRef, Step step, bytes32 eventHash) external {
        require(stepAllowed[roles[msg.sender]][step], "Step not allowed for role");
        attestations[lotRef].push(StepAttestation({
            timestamp: block.timestamp,
            actor: msg.sender,
            eventHash: eventHash,
            step: step
        }));
        emit StepAttested(lotRef, step, msg.sender, eventHash);
    }

    function getAttestations(bytes32 lotRef) external view returns (StepAttestation[] memory) {
        return attestations[lotRef];
    }

    function isStepAllowed(address actor, Step step) external view returns (bool) {
        return stepAllowed[roles[actor]][step];
    }
}
