import { MEDICAL_INFO } from "../constants";

class MedicalCredential {
    public '@context': string;
    public issuer: string;
    public issuanceDate: string;
    public credentialSubject: {[key: string]: any};
    public typeCredential: Array<string>;

    constructor(did: string, name: string) {
        this['@context'] = 'https://www.w3.org/2018/credentials/v1';
        this['issuer'] = process.env.ISSUER_DID as string;
        this['issuanceDate'] = this.getDateCreated();
        this.credentialSubject = {
            name: name,
            organization: {
                legalName: MEDICAL_INFO.legalName
            },
            role: MEDICAL_INFO.role,
            speciality: MEDICAL_INFO.speciality,
            email: 'john.doe@polaris.com',
            birthDate: '1990-10-06',
            address: 'xx',
            '@id': did,
            '@type': 'MedicalCredential'
        };
        this.typeCredential = ['MedicalCredential'];
    }

    getDateCreated() {
        return new Date().toISOString();
    }
}

export default MedicalCredential;