create table registeredPoS (
    deviceId text primary key,
    authorized integer not null,
    namePoS text,
    browser text,
    browserVersion text,
    ip text,
    createdOn datetime default current_timestamp);

create table tokens (
    tokenId text primary key,
    id text,
    isLocked integer,
    price real,
    jsonData text,
    createdOn datetime default current_timestamp);

create table appIds (
    appId text primary key,
    addressEth text,
    nonce integer
    createdOn datetime default current_timestamp);

create table salesEvents (
    typeMsg text,
    id text,
    isLocked integer,
    destinationAddr text,
    isStored integer,
    isTransferred integer,
    isFinalized integer,
    txId text,
    error text);

create table smartContracts (
    id integer primary key,
    addressEth text);

create table votes (
    id integer primary key,
    voteId text,
    voterAddr text,
    jsonData text,
    createdOn datetime default current_timestamp);

create table voteQuestionnaire (
    id integer primary key,
    voteId text,
    cid text,
    checksum text,
    jsonData text,
    createdOn datetime default current_timestamp);
