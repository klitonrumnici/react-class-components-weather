import React from "react";

function getWeatherIcon(wmoCode) {
    const icons = new Map([
        [[0], "☀️"],
        [[1], "🌤"],
        [[2], "⛅️"],
        [[3], "☁️"],
        [[45, 48], "🌫"],
        [[51, 56, 61, 66, 80], "🌦"],
        [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
        [[71, 73, 75, 77, 85, 86], "🌨"],
        [[95], "🌩"],
        [[96, 99], "⛈"],
    ]);
    const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
    if (!arr) return "NOT FOUND";
    return icons.get(arr);
}

function formatDay(dateStr) {
    return new Intl.DateTimeFormat("en", {
        weekday: "short",
    }).format(new Date(dateStr));
}


class App extends React.Component {
    state = {location: "", isLoading: false, displayLocation: "", weather: {}}

    constructor(props) {
        super(props);

        this.fetchWeather = this.fetchWeather.bind(this)
    }

    async fetchWeather() {
        if(this.state.location.length < 2) return this.setState({weather: {}})
        try {
            this.setState({isLoading: true})

            // 1) Getting location (geocoding)
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
            );
            const geoData = await geoRes.json();
            console.log(geoData);

            if (!geoData.results) throw new Error("Location not found");

            const {latitude, longitude, timezone, name, country_code} =
                geoData.results.at(0);
            this.setState({
                displayLocation: `${name}`
            });

            // 2) Getting actual weather
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
            );
            const weatherData = await weatherRes.json();
            this.setState({weather: weatherData.daily});
        } catch (err) {
            console.error(err);
        } finally {
            this.setState({isLoading: false})
        }
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.state.location !== prevState.location){
            this.fetchWeather()

            localStorage.setItem("location", this.state.location)
        }
    }

    componentDidMount() {
        this.setState({location: localStorage.getItem("location" || "")})
    }

    render() {
        return <div className="app">
            <h1>Weather App</h1>
            <div>
                <input type="text" placeholder="Search from location..." value={this.state.location}
                       onChange={e => this.setState({location: e.target.value})}/>
            </div>
            {/*<button onClick={this.fetchWeather}>Get weather</button>*/}
            {this.state.isLoading && <p className="loader">Loading...</p>}
            {this.state.weather.weathercode &&
                <DisplayWeather weather={this.state.weather} location={this.state.displayLocation}/>}
        </div>

    }
}

class DisplayWeather extends React.Component {

    componentWillUnmount() {
        console.log("Weather will unmount")
    }

    render() {

        const {temperature_2m_max: max, temperature_2m_min: min, time: dates, weathercode: codes} = this.props.weather
        return (
            <div>

                <h2>Weather in {this.props.location}</h2>
                <ul className="weather">
                    {dates.map((date, i) => (
                        <Day date={date} max={max.at(i)} min={min.at(i)} codes={codes.at(i)} key={date}/>))}
                </ul>

            </div>
        );
    }
}

class Day extends React.Component {
    render() {
        const {date, max, min, codes} = this.props
        return <li className="day">
            <span>{getWeatherIcon(codes)}</span>
            <p>{formatDay(date)}</p>
            <p>{Math.floor(min)}&deg; &mdash; {Math.ceil(max)}&deg;</p>
        </li>
    }
}

export default App