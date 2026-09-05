import styled from "styled-components";

export const Section = styled.div`
    margin-bottom: 32px;
`

export const Heading = styled.h2`
    font-size: 18px;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #dddddd;
`

// Puts the kickoff time on the same line as the matchup, pinned to the right.
export const MatchupRow = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 16px;
`

export const GameTime = styled.div`
    color: #666666;
    white-space: nowrap;
`
