import { CollectionReference, DocumentData, Query, QueryCompositeFilterConstraint, getDocs, query } from "firebase/firestore"

export const getDocuments = async (collectionRef: CollectionReference<DocumentData, DocumentData>, queryParams?: QueryCompositeFilterConstraint) => {
    const q = queryParams ? query(collectionRef, queryParams) : query(collectionRef)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
}