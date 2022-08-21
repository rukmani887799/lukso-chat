import React from "react";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { NavBar, ChatCard, Message, AddNewChat } from './components/Components.js';
import { ethers } from "ethers";
import { abi } from "./abi";
import './size.css';

// l16 contact adderss
const CONTRACT_ADDRESS = "0x95896950eC74266E785e623a1652a1221d84AD35";

export function App( props ) {  
    const [friends, setFriends] = useState(null);
    const [myName, setMyName] = useState(null);
    const [myPublicKey, setMyPublicKey] = useState(null);
    const [activeChat, setActiveChat] = useState({ friendname: null, publicKey: null });
    const [activeChatMessages, setActiveChatMessages] = useState(null);
    const [showConnectButton, setShowConnectButton] = useState("block");
    const [myContract, setMyContract] = useState(null);
   

  
    // Save the contents of abi in a variable
    const contractABI = abi; 
    let provider;
    let signer;

    // Login to Metamask and check the if the user exists else creates one
    async function login() {
        let res = await add();
        if( res === true ) {
            provider = new ethers.providers.Web3Provider( window.ethereum );
            signer = provider.getSigner();
            try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: '0xB0C',
                      chainName: 'L16',
                      rpcUrls: ['https://rpc.l16.lukso.network/'] /* ... */,
                      blockExplorerUrls:['https://explorer.execution.l16.lukso.network/'],
                      nativeCurrency: { 
                        symbol:'LYXt',   
                        decimals: 18
                      } 
                    
                    },
                  ],
                });
               
             
            try {
				const contract = new ethers.Contract( CONTRACT_ADDRESS, contractABI, signer );
				setMyContract( contract );
				const address = await signer.getAddress();         
				let present = await contract.checkUserExists( address );
				let username;
				if( present )
					username = await contract.getUsername( address );
				else {
					username = prompt('Enter a username', 'Guest'); 
					if( username === '' ) username = 'Guest';
					await contract.createAccount( username );
				}
				setMyName( username );
				setMyPublicKey( address );
				setShowConnectButton( "none" );
			} catch(err) {
				alert("Network added please Click again in Connect to Metamask Button");
                console.log(err);
			}
        }
    
        catch (err) {
            alert("Please change the netwrk to L16 Lusk!");
            console.log(err);
        }
     } else {
            alert("Metamask not available");
        }    
    }

    async function add() {
        try {
            await window.ethereum.enable();
            return true;
        } catch(err) {
            return false;
        }
    }

    // chain change 
    /*

    async function add() {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xB0C',
                  chainName: 'L16',
                  rpcUrls: ['https://rpc.l16.lukso.network/'] ,
                  blockExplorerUrls:['https://explorer.execution.l16.lukso.network/'],
                  nativeCurrency: { 
                    symbol:'LYXt',   
                    decimals: 18
                  } 
                
                },
              ],
            });
            return true;
          } catch (error) {
            console.log(error);
            return false;
            // handle "add" error
          }
        }
        */
        // handle other "switch" errors
      

    // Check if the Metamask connects 
   

    // Add a friend to the users' Friends List
    async function addChat( name, publicKey ) {
        try {
			let present = await myContract.checkUserExists( publicKey );
			if( !present ) {
				alert("Given address not found: Ask him to join the app :)");
				return;
			}
			try {
				await myContract.addFriend( publicKey, name );
				const frnd = { "name": name, "publicKey": publicKey };
				setFriends( friends.concat(frnd) );
			} catch(err) {
				alert("Friend already Added! You can't be friend with the same person twice ;P");
			}
		} catch(err) {
			alert("Invalid address!")
		}
    }

    // Sends messsage to an user 
    async function sendMessage( data ) {
        if( !( activeChat && activeChat.publicKey ) ) return;
        const recieverAddress = activeChat.publicKey;
        await myContract.sendMessage( recieverAddress, data );
    } 

    // Fetch chat messages with a friend 
    async function getMessage( friendsPublicKey ) {
        let nickname;
        let messages = [];
        friends.forEach( ( item ) => {
            if( item.publicKey === friendsPublicKey )
                nickname = item.name;
        });
        // Get messages
        const data = await myContract.readMessage( friendsPublicKey );
        data.forEach( ( item ) => {
            const timestamp = new Date( 1000*item[1].toNumber() ).toUTCString();
            messages.push({ "publicKey": item[0], "timeStamp": timestamp, "data": item[2] });
        });
        setActiveChat({ friendname: nickname, publicKey: friendsPublicKey });
        setActiveChatMessages( messages );
    }

    // auto run the function to retrive the data
    setInterval(function(){
    getMessage( activeChat.publicKey );
    },10000);
    // This executes every time page renders and when myPublicKey or myContract changes
    useEffect( () => {
        async function loadFriends() {
            let friendList = [];
            // Get Friends
            try {
                const data = await myContract.getMyFriendList();
                data.forEach( ( item ) => {
                    friendList.push({ "publicKey": item[0], "name": item[1] });
                })
            } catch(err) {
                friendList = null;  
            }
            setFriends( friendList );
        }
        loadFriends();
    }, [myPublicKey, myContract]);

    // Makes Cards for each Message
    const Messages = activeChatMessages ? activeChatMessages.map( ( message ) => {
        let margin = "3%";
        let sender = activeChat.friendname;
        if( message.publicKey === myPublicKey ) {
            margin = "30%";
            sender = "You";
        }
        return (
            <Message marginLeft={ margin } sender={ sender } data={ message.data } timeStamp={ message.timeStamp } />
        );
    }) : null;
  
    // Displays each card
    const chats = friends ? friends.map( ( friend ) => {
     return (
         <ChatCard publicKey={ friend.publicKey } name={ friend.name } getMessages={ ( key ) => getMessage( key ) } />
     );
    }) : null;

    return (
        <Container  className="size" style={{ padding:"0px", border:"px solid blue" }}>
            {/* This shows the navbar with connect button */}
            <NavBar username={ myName } login={ async () => login() } showButton={ showConnectButton } />
            <Row>
                {/* Here the friends list is shown */}
                <Col style={{ "paddingRight":"0px", "borderRight":"2px solid blue" }}>
                    <div style={{ "backgroundColor":"#b18ce6", "height":"100%", overflowY:"auto" }}>
                          <Row style={{ marginRight:"0px" }}  >
                              <Card style={{ width:'100%', alignSelf:'center', marginLeft:"15px" }}>
                                <Card.Header>
                                    Chats
                                </Card.Header>
                              </Card>
                          </Row>
                          { chats }
                          <AddNewChat myContract={ myContract } addHandler={ ( name, publicKey ) => addChat( name, publicKey )} />
                    </div>
                </Col>
                <Col xs={ 9 } style={{ "paddingLeft":"0px" }}>
                    <div style={{ "backgroundColor":"#b18ce6", "height":"100%" }}>
                        {/* Chat header with refresh button, username and public key are rendered here */}
                        <Row style={{ marginRight:"0px" }}>
                              <Card style={{ width:'100%', alignSelf:'center', margin:"0 0 4px 15px" }}>
                                <Card.Header>
                                    { activeChat.friendname } : { activeChat.publicKey }
                                    <Button id="refresh" style={{ float:"right" }} variant="warning" onClick={ () => {
                                        if( activeChat && activeChat.publicKey )
                                            getMessage( activeChat.publicKey );
                                    } }>
                                        Refresh
                                    </Button>
                                </Card.Header>
                            </Card>
                        </Row>
                        {/* The messages will be shown here */}
                        <div className="MessageBox" style={{ height:"450px", overflow:"auto" }}>
                           { Messages }
                        </div>
                        {/* The form with send button and message input fields */}
                        <div className="SendMessage"  style={{ borderTop:"2px solid blue", position:"relative", bottom:"0px", padding:"32px 50px 0 45px", margin:"0 90px 0 0", width:"97%" ,height:"100px" }}>
                            <Form onSubmit={ (e) => {
			                	e.preventDefault();
			                	sendMessage( document.getElementById( 'messageData' ).value );
			                	document.getElementById( 'messageData' ).value = "";
			                }}>
                                <Form.Row className="align-items-center">
                                    <Col xs={9}>
                                        <Form.Control id="messageData" className="mb-4"  placeholder="Send Message" />
                                    </Col>
                                    <Col >
                                      <Button className="mb-2" style={{ float:"right" }} onClick={ () => {
                                          sendMessage( document.getElementById( 'messageData' ).value );
                                          document.getElementById( 'messageData' ).value = "";
                                      }}>
                                        Send
                                      </Button>
                                    </Col>
                                </Form.Row>
                            </Form>
                        </div> 
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
