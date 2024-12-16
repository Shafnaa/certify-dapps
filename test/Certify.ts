import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei, keccak256, publicActions } from "viem";

describe("Certify Contract", function () {
  // Define a fixture for deploying the Certify contract
  async function deployCertifyFixture() {
    const [chairperson, publisher1, publisher2, user1] =
      await hre.viem.getWalletClients();

    const Certify = await hre.viem.deployContract("Certify", [
      "ChairpersonUsername",
    ]);

    return {
      Certify,
      chairperson,
      publisher1,
      publisher2,
      user1,
    };
  }

  describe("Publisher Management", function () {
    it("Should allow chairperson to add a publisher", async function () {
      const { Certify, publisher1 } = await loadFixture(deployCertifyFixture);

      const username = "Publisher1";
      await Certify.write.giveRightToPublish([
        publisher1.account.address,
        username,
      ]);

      const publisher = await Certify.read.getPublisher([
        publisher1.account.address,
      ]);
      expect(publisher).to.equal(username);
    });

    it("Should not allow non-chairperson to add a publisher", async function () {
      const { Certify, publisher1, publisher2 } =
        await loadFixture(deployCertifyFixture);

      const username = "Publisher2";
      await expect(
        Certify.write.giveRightToPublish(
          [publisher2.account.address, username],
          {
            account: publisher1.account,
          }
        )
      ).to.be.rejectedWith("Only chairperson can call this function.");
    });

    it("Should allow chairperson to revoke a publisher", async function () {
      const { Certify, publisher1 } = await loadFixture(deployCertifyFixture);

      await Certify.write.giveRightToPublish([
        publisher1.account.address,
        "Publisher1",
      ]);
      await Certify.write.revokePublisher([publisher1.account.address]);

      await expect(
        Certify.read.getPublisher([publisher1.account.address])
      ).to.be.rejectedWith("Publisher is not valid!");
    });

    it("Should not allow non-chairperson to revoke a publisher", async function () {
      const { Certify, publisher1, publisher2 } =
        await loadFixture(deployCertifyFixture);

      await expect(
        Certify.write.revokePublisher([publisher2.account.address], {
          account: publisher1.account,
        })
      ).to.be.rejectedWith("Only chairperson can call this function.");
    });
  });

  describe("Certificate Publishing", function () {
    it("Should allow a publisher to publish a certificate", async function () {
      const { Certify, publisher1, user1 } =
        await loadFixture(deployCertifyFixture);

      const username = "Publisher1";
      await Certify.write.giveRightToPublish([
        publisher1.account.address,
        username,
      ]);

      const certificateURI = "https://example.com/certificate";
      const signature = await publisher1.signMessage({
        message: keccak256(Buffer.from(certificateURI)),
      });

      const [r, s, v] = await Certify.read.splitSignature([signature]);

      const txHash = await Certify.write.publishCertificateToken([
        user1.account.address,
        v,
        r,
        s,
        certificateURI,
      ]);

      // Wait for the transaction to be mined by polling the transaction receipt
      const publicClient = await hre.viem.getPublicClient();
      let receipt;
      while (!receipt) {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (!receipt) {
          // Wait for some time before checking again
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Listen for the CertificatePublished event to get the tokenId
      const events = await Certify.getEvents.CertificatePublished({
        recipient: user1.account.address,
      });

      // Check if the event was emitted and capture the tokenId
      expect(events).to.have.lengthOf(1);
      const tokenId = events[0].args.tokenId;
      expect(tokenId).to.be.a("bigint");
    });

    it("Should revert if the publisher is not authorized", async function () {
      const { Certify, user1 } = await loadFixture(deployCertifyFixture);

      const certificateURI = "https://example.com/certificate";
      const signature = await user1.signMessage({
        message: keccak256(Buffer.from(certificateURI)),
      });
      const [r, s, v] = await Certify.read.splitSignature([signature]);

      await expect(
        Certify.write.publishCertificateToken(
          [user1.account.address, v, r, s, certificateURI],
          {
            account: user1.account,
          }
        )
      ).to.be.rejectedWith("Only valid publisher can call this function.");
    });
  });

  describe("Certificate Verification", function () {
    it("Should verify a valid certificate", async function () {
      const { Certify, publisher1, user1 } =
        await loadFixture(deployCertifyFixture);

      const username = "Publisher1";
      await Certify.write.giveRightToPublish([
        publisher1.account.address,
        username,
      ]);

      const certificateURI = "https://example.com/certificate";

      const certificateHash = keccak256(Buffer.from(certificateURI));

      const signature = await publisher1.request({
        method: "personal_sign",
        params: [certificateHash, publisher1.account.address],
      });

      const [r, s, v] = await Certify.read.splitSignature([signature]);

      const txHash = await Certify.write.publishCertificateToken([
        user1.account.address,
        v,
        r,
        s,
        certificateURI,
      ]);

      // Wait for the transaction to be mined by polling the transaction receipt
      const publicClient = await hre.viem.getPublicClient();
      let receipt;
      while (!receipt) {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (!receipt) {
          // Wait for some time before checking again
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Listen for the CertificatePublished event to get the tokenId
      const events = await Certify.getEvents.CertificatePublished({
        recipient: user1.account.address,
      });

      // Check if the event was emitted and capture the tokenId
      expect(events).to.have.lengthOf(1);
      const tokenId = events[0].args.tokenId;
      expect(tokenId).to.be.a("bigint");

      if (tokenId) {
        const validCertificate = await Certify.read.verifyCertificate([
          tokenId,
          certificateHash,
          publisher1.account.address,
        ]);

        expect(validCertificate[0]).to.be.true;
        expect(validCertificate[1]).to.equal(username);
      }
    });

    it("Should fail verification for an invalid certificate", async function () {
      const { Certify, publisher1, user1 } =
        await loadFixture(deployCertifyFixture);

      const username = "Publisher1";
      await Certify.write.giveRightToPublish([
        publisher1.account.address,
        username,
      ]);

      const certificateURI = "https://example.com/certificate";
      const signature = await publisher1.request({
        method: "personal_sign",
        params: [
          keccak256(Buffer.from(certificateURI)),
          publisher1.account.address,
        ],
      });
      const [r, s, v] = await Certify.read.splitSignature([signature]);

      const txHash = await Certify.write.publishCertificateToken([
        user1.account.address,
        v,
        r,
        s,
        certificateURI,
      ]);

      // Wait for the transaction to be mined by polling the transaction receipt
      const publicClient = await hre.viem.getPublicClient();
      let receipt;
      while (!receipt) {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (!receipt) {
          // Wait for some time before checking again
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Listen for the CertificatePublished event to get the tokenId
      const events = await Certify.getEvents.CertificatePublished({
        recipient: user1.account.address,
      });

      // Check if the event was emitted and capture the tokenId
      expect(events).to.have.lengthOf(1);
      const tokenId = events[0].args.tokenId;
      expect(tokenId).to.be.a("bigint");

      const invalidSigner = user1.account.address;
      const certificateHash = keccak256(Buffer.from(certificateURI));

      if (tokenId) {
        const validCertificate = await Certify.read.verifyCertificate([
          tokenId,
          certificateHash,
          invalidSigner,
        ]);

        expect(validCertificate[0]).to.be.false;
      }
    });
  });
});
