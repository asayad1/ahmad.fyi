
// Button component 
const Button = (props) => (
    // props.msg is text 
    // props.link is hyperlink
    //props.color is color of the button 
    //props.id is individual id of each button
    <div>
        <a className="button" id={props.id} href={props.link} target="none"  style={{backgroundColor:props.color}}>
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
            <Button msg={"Ambulances"} link={"https://aha.miemss.org/dashboard"} id={"amb"} color="blue"/>
            <Button msg={"CHATS"} link={"https://www.miemssalert.com/chats/Default.aspx?hdRegion=5&hdtab=Hospitals"} id={"chats"} color="green"/>
            <Button msg={"HTSD"} link={"http://htsd.mocofire.com/"} id={"htsd"} color="red"/>
        </div>
    )
}



function App()
{
    return(
        <div>
            <Navbar />
            <Buttons />
        </div>
    )
}


ReactDOM.render(<App />, document.getElementById("root"))