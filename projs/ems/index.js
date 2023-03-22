// Button component 
const Button = (props) => (
    // props.msg is text 
    // props.link is hyperlink
    //props.color is color of the button 
    //props.id is individual id of each button
    <div>
        <a className="button" id={props.id} href={props.link} target={props.trgt ? "_self" : "_blank"}  style={{backgroundColor:props.color}}>
            {props.msg}
        </a>
    </div>
)

// Navigation bar component at the top of the page 
function Navbar()
{
    return (
        <div className="navbar">
            <h1> EMS Link Collection </h1>
        </div>
    )
}

// Buttons collection to be rendered
function Buttons()
{   
    return (
        <div className="buttons">
            <div className="buttons">        
            <Button msg={"Ambulances"} link={"https://aha.miemss.org/dashboard"} id={"amb"} color="blue"/>
            <Button msg={"CHATS"} link={"https://www.miemssalert.com/chats/Default.aspx?hdRegion=5&hdtab=Hospitals"} id={"chats"} color="green"/>
            <Button msg={"HTSD"} link={"http://htsd.mocofire.com/"} id={"htsd"} color="red"/>
            <Button msg={"References"} link={"./references.html"} trgt={"true"} id={"sm"} color="#E47305"/>
            <Button msg={"eMEDS"} link={"https://www.mdemeds.com/Elite/Organizationmaryland/RunForm/Login"} id={"emeds"} color="#b6081b"/>
            <Button msg={"Protocol"} link={"https://www.miemss.org/home/ems-providers/protocols"} id={"proto"} color="navy"/>
            <Button msg={"Barclay"} link={"https://jeffbarclay.com/"} id={"barclay"} color="salmon"/>
            <Button msg={"Activity Tracker"} link={"https://www2.montgomerycountymd.gov/PIMSACT/Login.aspx?AspxAutoDetectCookieSupport=1"} id={"activity"} color="gray"/>            
      </div>
        </div>
    )
}

function App()
{
    return(
        <div className="buttonCollection">
            <Navbar />
            <div>
                <Buttons />
            </div>
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById("root"))