import "./Ownable.sol";
import "./provableAPI.sol";

pragma solidity 0.5.12;

contract CoinToss is Ownable, usingProvable {
    struct Game {
        address payable player;
        uint256 amount;
        StatusTypes status;
    }

    uint256 public balance;
    mapping(bytes32 => Game) public games;
    mapping(address => bytes32[]) public queries;

    enum StatusTypes {Pending, Win, Lose}

    modifier costs(uint256 cost) {
        require(msg.value >= cost, "Payment under minimum.");
        _;
    }

    event Outcome(
        address indexed player,
        bytes32 queryId,
        uint256 amount,
        StatusTypes status
    );

    constructor() public payable {
        balance = msg.value;
    }

    function toss() public payable costs(1 ether) {
        balance += msg.value;
        tossCoin();
    }

    function tossCoin() public payable {
        uint256 queryExecutionDelay = 0;
        uint256 numRandomBytesRequested = 1;
        uint256 gasForCallBack = 200000;
        bytes32 queryId = provable_newRandomDSQuery(
            queryExecutionDelay,
            numRandomBytesRequested,
            gasForCallBack
        );

        createGame(queryId);
    }

    function __callback(
        bytes32 _queryId,
        string memory _result,
        bytes memory _proof
    ) public {
        require(
            msg.sender == provable_cbAddress(),
            "Invalid callback address."
        );

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) %
            2;

        Game memory game = games[_queryId];
        game.status = StatusTypes.Lose;
        if (randomNumber == 1) {
            game.status = StatusTypes.Win;
            uint256 toTransfer = game.amount * 2;
            balance -= toTransfer;
            game.player.transfer(toTransfer);
        }

        emit Outcome(game.player, _queryId, game.amount, game.status);
    }

    function createGame(bytes32 _queryId) private {
        Game memory game;
        game.player = msg.sender;
        game.amount = msg.value;
        game.status = StatusTypes.Pending;

        games[_queryId] = game;
        queries[msg.sender].push(_queryId);
    }

    function testToss(bytes32 _queryId) public payable {
        createGame(_queryId);
    }

    function testCallback(bytes32 _queryId, uint256 _result) public {
        Game memory game = games[_queryId];
        game.status = StatusTypes.Lose;

        uint256 randomNumber = _result;

        if (randomNumber == 1) {
            game.status = StatusTypes.Win;
            uint256 toTransfer = game.amount * 2;
            balance -= toTransfer;
            game.player.transfer(toTransfer);
        }

        emit Outcome(msg.sender, _queryId, game.amount, game.status);
    }

    function withdrawAll() public onlyOwner returns (uint256) {
        uint256 toTransfer = balance;
        balance = 0;

        msg.sender.transfer(toTransfer);
        return toTransfer;
    }
}
