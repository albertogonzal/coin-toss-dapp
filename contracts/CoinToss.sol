pragma solidity 0.5.12;
import "./Ownable.sol";
import "./provableAPI.sol";

contract CoinToss is Ownable, usingProvable {
    struct Game {
        address payable player;
        uint256 amount;
        uint256 blockNumber;
        StatusTypes status;
    }

    uint256 public balance;
    // mapping(bytes32 => Game) public games;
    mapping(string => Game) public games;
    // mapping(address => bytes32[]) public queries;
    mapping(address => string[]) public queries;

    enum StatusTypes {Pending, Sent, Completed}

    modifier costs(uint256 cost) {
        require(msg.value >= cost, "Payment under minimum.");
        _;
    }

    // event LogNewProvableQuery(bytes32 query);
    event LogNewProvableQuery(string query);
    event GeneratedRandomNumber(uint256 randomNumber);
    event Outcome(string outcome);

    event CoinTossed(bool hasWon, uint256 amount);

    constructor() public payable {
        balance = msg.value;
        // provable_setProof(proofType_Ledger);
    }

    function toss() public payable costs(1 ether) {
        balance += msg.value;
        update();
    }

    function update() public payable {
        // uint256 queryExecutionDelay = 0;
        // uint256 numRandomBytesRequested = 1;
        // uint256 gasForCallBack = 200000;
        // bytes32 queryId = provable_newRandomDSQuery(
        //     queryExecutionDelay,
        //     numRandomBytesRequested,
        //     gasForCallBack
        // );
        // bytes32 queryId = bytes32(now);
        string memory queryId = "a";

        Game memory game;
        game.player = msg.sender;
        game.amount = msg.value;
        game.blockNumber = block.number;
        game.status = StatusTypes.Pending;

        games[queryId] = game;
        queries[msg.sender].push(queryId);
        emit LogNewProvableQuery(queryId);
    }

    function testCallback(string memory _queryId) public {
        string memory outcome = "lose";
        // uint256 randomNumber = now % 2;
        uint256 randomNumber = 1;
        Game memory game = games[_queryId];
        game.blockNumber = block.number;
        game.status = StatusTypes.Completed;

        if (randomNumber == 1) {
            outcome = "win";
            uint256 toTransfer = game.amount * 2;
            balance -= toTransfer;
            game.player.transfer(toTransfer);
        }
        emit GeneratedRandomNumber(randomNumber);
        emit Outcome(outcome);
    }

    // function __callback(
    //     bytes32 _queryId,
    //     string memory _result,
    //     bytes memory _proof
    // ) public {
    //     require(
    //         msg.sender == provable_cbAddress(),
    //         "Invalid callback address."
    //     );

    //     if (
    //         provable_randomDS_proofVerify__returnCode(
    //             _queryId,
    //             _result,
    //             _proof
    //         ) != 0
    //     ) {
    //         // proof verification failed
    //     } else {
    //         uint256 randomNumber = uint256(
    //             keccak256(abi.encodePacked(_result))
    //         ) % 2;

    //         Game memory game = games[_queryId];
    //         game.blockNumber = block.number;
    //         game.status = StatusTypes.Completed;
    //         if (randomNumber == 1) {
    //             uint256 toTransfer = game.amount * 2;
    //             balance -= toTransfer;
    //             game.player.transfer(toTransfer);
    //         }
    //         emit GeneratedRandomNumber(randomNumber);
    //     }
    // }

    function withdrawAll() public onlyOwner returns (uint256) {
        uint256 toTransfer = balance;
        balance = 0;
        msg.sender.transfer(toTransfer);
        return toTransfer;
    }
}
