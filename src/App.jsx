import "./App.css";
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
} from "react-bootstrap";
import { useState, useEffect } from "react";

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState({}); // Add state to store tracks for each album

  useEffect(() => {
    let authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        clientId +
        "&client_secret=" +
        clientSecret,
    };

    fetch("https://accounts.spotify.com/api/token", authParams)
      .then((result) => result.json())
      .then((data) => {
        setAccessToken(data.access_token);
      });
  }, []);

  async function search() {
    let artistParams = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    // Get Artist
    const artistID = await fetch(
      "https://api.spotify.com/v1/search?q=" + searchInput + "&type=artist",
      artistParams
    )
      .then((result) => result.json())
      .then((data) => {
        return data.artists.items[0].id;
      });

    // Get Artist Albums
    const albumsData = await fetch(
      "https://api.spotify.com/v1/artists/" +
        artistID +
        "/albums?include_groups=album&market=US&limit=50",
      artistParams
    )
      .then((result) => result.json())
      .then((data) => data.items);

    setAlbums(albumsData);

    // Fetch top 3 tracks and calculate playtime for each album
    const tracksData = {};
    for (const album of albumsData) {
      const albumTracks = await fetch(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?market=US`,
        artistParams
      )
        .then((result) => result.json())
        .then((data) => {
          const totalPlaytime = data.items.reduce(
            (sum, track) => sum + track.duration_ms,
            0
          );
          album.totalPlaytime = totalPlaytime; // Store total playtime in milliseconds
          return data.items
            .sort((a, b) => b.popularity - a.popularity) // Sort by popularity
            .slice(0, 3); // Get top 3 tracks
        });
      tracksData[album.id] = albumTracks;
    }
    setTracks(tracksData);
  }

  return (
    <>
      <Container>
        <InputGroup>
          <FormControl
            placeholder="Search For Artist"
            type="input"
            aria-label="Search for an Artist"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                search();
              }
            }}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{
              width: "300px",
              height: "35px",
              borderWidth: "0px",
              borderStyle: "solid",
              borderRadius: "5px",
              marginRight: "10px",
              paddingLeft: "10px",
            }}
          />
          <Button onClick={search}>Search</Button>
        </InputGroup>
      </Container>

      <Container>
        <Row
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-around",
            alignContent: "center",
          }}
        >
          {albums.map((album) => {
            const playtimeMinutes = Math.floor(album.totalPlaytime / 60000);
            const playtimeSeconds = Math.floor((album.totalPlaytime % 60000) / 1000);

            return (
              <Card
                key={album.id}
                style={{
                  backgroundColor: "white",
                  margin: "10px",
                  borderRadius: "5px",
                  marginBottom: "30px",
                }}
              >
                <Card.Img
                  width={200}
                  src={album.images[0].url}
                  style={{
                    borderRadius: "4%",
                  }}
                />
                <Card.Body>
                  <Card.Title
                    style={{
                      whiteSpace: "wrap",
                      fontWeight: "bold",
                      maxWidth: "200px",
                      fontSize: "18px",
                      marginTop: "10px",
                      color: "black",
                    }}
                  >
                    {album.name}
                  </Card.Title>
                  <Card.Text
                    style={{
                      color: "black",
                    }}
                  >
                    Release Date: <br /> {album.release_date}
                  </Card.Text>
                  <Card.Text
                    style={{
                      color: "black",
                    }}
                  >
                    Total Tracks: {album.total_tracks}
                  </Card.Text>
                  <Card.Text
                    style={{
                      color: "black",
                    }}
                  >
                    Playtime: {playtimeMinutes}m {playtimeSeconds}s
                  </Card.Text>
                  {tracks[album.id] && (
                    <div style={{ marginTop: "10px" }}>
                      <h6>Top Tracks:</h6>
                      <ul>
                        {tracks[album.id].map((track) => (
                          <li key={track.id} style={{ color: "black" }}>
                            {track.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer
                  style={{
                    backgroundColor: "white",
                    borderTop: "none",
                    textAlign: "center",
                  }}
                >
                  <Button
                    href={album.external_urls.spotify}
                    style={{
                      backgroundColor: "black",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "15px",
                      borderRadius: "5px",
                      padding: "10px",
                    }}
                  >
                    Album Link
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </Row>
      </Container>
    </>
  );
}

export default App;