import { ProofTypeEthereum, EthCore } from '@kaytrust/ethereum';

export const verifyData = async (verifiableObject: {[key: string]: any}, validDays = 0) => {
    const ethCoreInstance = new EthCore(process.env.NODE_URL as string, process.env.PRIVATE_KEY as string);
    const proofType = new ProofTypeEthereum(ethCoreInstance, { identityManager: process.env.IDENTITY_MANAGER as string, verificationRegistry: process.env.VERIFICATION_REGISTRY as string, validDays });
    const verifiableObjectWithProof = await proofType.generateProof(verifiableObject);
    return { state: true, verifiableObjectWithProof, error: null };
};