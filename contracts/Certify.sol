// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Certify is ERC721URIStorage {
    struct Publisher {
        string username;
        bool isValid;
    }

    struct Certificate {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    uint256 private tokenCounter;

    address public chairperson;

    mapping(address => Publisher) private publishers;
    mapping(uint256 => Certificate) private certificates;

    event PublisherAdded(address indexed publisher, string username);
    event PublisherRevoked(address indexed publisher);
    event CertificatePublished(address indexed recipient, uint256 tokenId);

    constructor(string memory _username) ERC721("Certify Token", "CRTFY") {
        chairperson = msg.sender;
        tokenCounter = 1;

        publishers[chairperson] = Publisher({
            username: _username,
            isValid: true
        });
    }

    /*
        THESE ARE THE FUNCTIONS USED TO DEAL WITH THE CERTIFY CONTRACT
    */

    modifier onlyChairperson() {
        require(
            msg.sender == chairperson,
            "Only chairperson can call this function."
        );
        _;
    }

    modifier publisherExists(address _publisher) {
        require(
            !publishers[_publisher].isValid,
            "This address already has the right to publish!"
        );
        _;
    }

    modifier onlyPublisher() {
        require(
            publishers[msg.sender].isValid,
            "Only valid publisher can call this function."
        );
        _;
    }

    modifier isPublisher(address _publisher) {
        require(
            publishers[_publisher].isValid,
            "This address is not a valid publisher!"
        );
        _;
    }

    /**
     * @notice This function is used to give the right to publish to an address
     * @param _publisher The address that will receive the right to publish
     * @param _username The username of the publisher
     */
    function giveRightToPublish(
        address _publisher,
        string memory _username
    ) external onlyChairperson publisherExists(_publisher) {
        publishers[_publisher] = Publisher({
            username: _username,
            isValid: true
        });
        emit PublisherAdded(_publisher, _username);
    }

    /**
     * @notice This function is used to publish a certificate token
     * @param _to The address that will receive the token
     * @param _v The v component of the signature
     * @param _r The r component of the signature
     * @param _s The s component of the signature
     * @param _tokenURI The URI of the token
     */
    function publishCertificateToken(
        address _to,
        uint8 _v,
        bytes32 _r,
        bytes32 _s,
        string memory _tokenURI
    ) public onlyPublisher {
        uint256 tokenId = tokenCounter++;

        certificates[tokenId] = Certificate({v: _v, r: _r, s: _s});

        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit CertificatePublished(_to, tokenId);
    }

    /**
     * @notice This function is used to check the eligibility of the publisher
     * @param _publisher The address of the publisher
     * @return publisher The username of the publisher
     */
    function getPublisher(
        address _publisher
    ) public view returns (string memory publisher) {
        require(publishers[_publisher].isValid, "Publisher is not valid!");

        return publishers[_publisher].username;
    }

    /**
     * @notice This function is used to revoke the right to publish from an address
     * @param _publisher The address of the publisher
     */
    function revokePublisher(address _publisher) external onlyChairperson {
        require(publishers[_publisher].isValid, "Publisher does not exist!");

        publishers[_publisher].isValid = false;

        emit PublisherRevoked(_publisher);
    }

    /**
     * @notice This function is used to transfer the chairperson role
     * @param newChairperson The address of the new chairperson
     */
    function transferChairperson(
        address newChairperson
    ) external onlyChairperson {
        require(newChairperson != address(0), "Invalid address");

        chairperson = newChairperson;
    }

    /**
     * @notice This function is used to check the validity of a certificate
     * @param _tokenId The id of the token
     * @param _hashMessage The hash of the message
     * @param _signer The address of the signer
     * @return validCertificate The validity of the certificate
     * @return username The username of the publisher
     */
    function verifyCertificate(
        uint256 _tokenId,
        bytes32 _hashMessage,
        address _signer
    ) public view returns (bool validCertificate, string memory username) {
        Certificate memory certificate = certificates[_tokenId];

        validCertificate = isValid(
            _signer,
            _hashMessage,
            certificate.v,
            certificate.r,
            certificate.s
        );

        if (validCertificate) {
            username = publishers[_signer].username;
            return (validCertificate, username);
        }

        return (false, "Not a valid certificate!");
    }

    /**
     * @notice This function is used to get the token counter
     * @return tokenCounter The token counter
     */
    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }

    /*
        THESE ARE THE PURE HELPER FUNCTION USED TO DEAL WITH SIGNATURE VERIFICATION
    */

    /**
     * @notice Returns the hash of a message
     * @param _message The message to hash
     * @return messageHash The hash of the message
     */
    function getMessageHash(
        string memory _message
    ) public pure returns (bytes32 messageHash) {
        return keccak256(abi.encodePacked(_message));
    }

    /**
     * @notice Splits an ECDSA signature into its r, s and v components
     * @param _signature The ECDSA signature
     * @return r The r component of the signature
     * @return s The s component of the signature
     * @return v The v component of the signature
     */
    function splitSignature(
        bytes memory _signature
    ) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        return (r, s, v);
    }

    /**
     * @notice Recovers the address for an ECDSA signature and message hash, note that the hash is automatically prefixed with "\x19Ethereum Signed Message:\n32"
     * @param _messageHash The hash of the message
     * @param _v The v component of the signature
     * @param _r The r component of the signature
     * @param _s The s component of the signature
     * @return signer The address that was used to sign the message
     */
    function recoverAddress(
        bytes32 _messageHash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (address signer) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(prefix, _messageHash)
        );
        return ecrecover(prefixedHash, _v, _r, _s);
    }

    /**
     * @notice Checks if the recovered address from an ECDSA signature is equal to the address `signer` provided.
     * @param _signer The address to check against
     * @param _messageHash The hash of the message
     * @param _v The v component of the signature
     * @param _r The r component of the signature
     * @param _s The s component of the signature
     * @return valid Whether the provided address matches with the signature
     */
    function isValid(
        address _signer,
        bytes32 _messageHash,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (bool valid) {
        return recoverAddress(_messageHash, _v, _r, _s) == _signer;
    }
}
