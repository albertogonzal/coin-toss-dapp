pragma solidity 0.5.12;
import "./Ownable.sol";
import "./provableAPI.sol";

contract CoinToss is Ownable, usingProvable {
    mapping(uint256 => Game) public games;
    struct Game {
        address payable player;
        uint256 amount;
        StatusTypes status;
    }

    uint256 public balance;
    mapping(address => uint256[]) public queries;
    uint256 public queryId = 0;
    // mapping(bytes32 => Game) public games;
    // mapping(address => bytes32[]) public queries;

    enum StatusTypes {Pending, Win, Lose}

    modifier costs(uint256 cost) {
        require(msg.value >= cost, "Payment under minimum.");
        _;
    }

    event CoinTossed(address indexed sender, uint256 queryId, uint256 amount);
    event Outcome(
        address indexed sender,
        uint256 queryId,
        uint256 amount,
        StatusTypes status
    );
    event TestEvent(address indexed from, string message);

    constructor() public payable {
        balance = msg.value;
        // provable_setProof(proofType_Ledger);
    }

    function testEvent() public {
        emit TestEvent(msg.sender, "test event");
    }

    function toss() public payable costs(1 ether) {
        balance += msg.value;
        tossCoin();
    }

    function tossCoin() public payable {
        // uint256 queryExecutionDelay = 0;
        // uint256 numRandomBytesRequested = 1;
        // uint256 gasForCallBack = 200000;
        // bytes32 queryId = provable_newRandomDSQuery(
        //     queryExecutionDelay,
        //     numRandomBytesRequested,
        //     gasForCallBack
        // );

        Game memory game;
        game.player = msg.sender;
        game.amount = msg.value;
        game.status = StatusTypes.Pending;

        games[queryId] = game;
        queries[msg.sender].push(queryId);
        queryId++;

        emit CoinTossed(game.player, queryId, game.amount);
    }

    function testCallback(uint256 _queryId) public {
        uint256 randomNumber = 0;

        Game memory game = games[_queryId];
        game.status = StatusTypes.Lose;

        if (randomNumber == 1) {
            game.status = StatusTypes.Win;
            uint256 toTransfer = game.amount * 2;
            balance -= toTransfer;
            game.player.transfer(toTransfer);
        }

        emit Outcome(msg.sender, queryId, game.amount, game.status);
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
    //     }
    // }

    function withdrawAll() public onlyOwner returns (uint256) {
        uint256 toTransfer = balance;
        balance = 0;

        msg.sender.transfer(toTransfer);
        return toTransfer;
    }
}
