import React, {useState, useEffect} from "react";
import {ethers} from "ethers";
import {create as ipfsHttpClient} from "ipfs-http-client";
import Web3Modal from "web3modal";

import {
    nftaddress, nftmarketaddress
} from "../config";

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import axios from "axios";

export default function MyAssets() {
    const [nfts, setNfts] = useState([]);
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNFTs();
    }, [])

    async function loadNFTs() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
        const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer)

        const data = await marketContract.fetchMyNFTs();
        const items = await Promise.all(data.map(async i => {
            const tokenUri = await tokenContract.tokenURI(i.tokenId);
            const meta = await axios.get(tokenUri);
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                tokenId: i.tokenId.toNumber().tokenId,
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
            }
            return item;
        }));
        setNfts(items);
        setLoadingState('loaded');
    }

    if (loadingState === 'loaded' && !nfts.length) return (
        <h1 className="py-10 px-20 text-3xl">No assets owned</h1>
    );

    return (
        <div className="flex justify-center">
            <div className="px-4" style={{maxWidth: '1600px'}}>
                <div className="grid grid-cols-1, sm:grid-cols-2, lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, i) => (
                            <div key={i} className="border shadow rounded-xl overflow-hidden">
                                <img src={nft.image} alt="NFT token image"/>
                                <div className="p-4">
                                    <p style={{height: "64px"}} className="text-2xl font-semibold">{nft.name}</p>
                                    <div style={{height:'70px', overflow: 'hidden'}}>
                                        <p className="text-gray-400">{nft.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                                </div>
                            </div>
                        ))
                    }

                </div>
            </div>
        </div>
    )
}