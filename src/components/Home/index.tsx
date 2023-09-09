import * as React from 'react';
import { StyledList, StyledListItem, StyledListTitle } from './index.styles';

const Home = () => (
    <>
        <h1>
            NFL Picks
        </h1>
       
        <StyledListTitle>
            Instructions
        </StyledListTitle>
        <StyledList>
            <StyledListItem>Login with Google, Facebook, Twitter</StyledListItem>
            <StyledListItem>Click the top left menu and select Submit Picks</StyledListItem>
            <StyledListItem>Fill out the form and click submit at the bottom</StyledListItem>
            <StyledListItem>Click the top left menu and select Standings to view everyones picks</StyledListItem>
        </StyledList>
    </>
)

export default Home
