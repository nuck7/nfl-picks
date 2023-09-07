import { Button, FormField } from "grommet";
import styled from "styled-components";
import { fontSize } from "../../theme";

export const PickContainer = styled.div`
    display: flex;
    flex-direction: column;
`

export const PointsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
`

export const MatchupLabel = styled.div`
    font-size: 24px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: row;
`

export const AtContainer = styled.div`
    font-size: ${fontSize.medium};
    padding: 0 48px;
`

export const StyledFormField = styled(FormField)`
    margin: 0 24px;
    display: flex;
    flex-direction: column;
    &>label {
        font-size: 16px
    }
`

export const StyledPointsFormField = styled(FormField)`
    max-width: 90%
`

export const StyledPointsFormFieldLabel = styled(FormField)`
`

export const TeamSelectContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0px 24px 40px 24px;
`





//   export const MatchupContainer = styled.div`
//       display: flex;
//       flex-direction: column;
//   `

//   export const TeamSelectContainer = styled.div`
//       display: flex;
//       flex-direction: row;
//    `
//   export const TeamSelectContainer = styled.div`
//       display: flex;
//       flex-direction: row;
//       margin: 0px 24px 40px 24px;
//   `

//   export const MatchupLabel = styled.div`
//       font-size: 24px;
//       margin-bottom: 16px;
//   `

//   export const StyledFormField = styled(FormField)`
//      margin: 0 24px;
//   `

export const SubmitButton = styled(Button)`
      width: 84px;
      height: 36px;
      border-radius: 16px;
      text-align: center;
  `

//   export const AtContainer = styled.div`
//       font-size: ${fontSize.medium};
//       padding-top: 48px;
//   `

export const FormFieldLabel = styled(FormField)`
      label: {
          font-size: ${fontSize.medium};
      };
  `

export const DateContainer = styled.div`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
  `