import Capacitor
import GameKit
import UIKit

class TradeUpBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TradeUpGameCenterPlugin())
    }
}

@objc(TradeUpGameCenterPlugin)
public class TradeUpGameCenterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TradeUpGameCenterPlugin"
    public let jsName = "TradeUpGameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "load", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submit", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareImage", returnType: CAPPluginReturnPromise)
    ]
    private let boardIDs: Set<String> = ["tradeup.wealth.v1", "tradeup.profit100.v1", "tradeup.homebudget.v1"]
    private var authenticationCall: CAPPluginCall?
    private var authenticationID: UUID?
    private var sharing = false

    @objc func shareImage(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard !self.sharing, let presenter = self.bridge?.viewController,
                  presenter.presentedViewController == nil else { call.reject("PRESENTATION_BUSY"); return }
            guard let png = call.getString("png"), png.utf8.count <= 3000000,
                  let data = Data(base64Encoded: png), data.count <= 2097152,
                  let image = UIImage(data: data), image.size.width == 1080, image.size.height == 1350 else {
                call.reject("INVALID_IMAGE"); return
            }
            // UIImage activity sharing needs no app-owned disk file, gallery
            // permission, Filesystem SDK or file-timestamp privacy API.
            let controller = UIActivityViewController(activityItems: [image], applicationActivities: nil)
            if let popover = controller.popoverPresentationController {
                popover.sourceView = presenter.view
                popover.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 1, height: 1)
                popover.permittedArrowDirections = []
            }
            self.sharing = true
            controller.completionWithItemsHandler = { _, completed, _, error in
                self.sharing = false
                if let error = error { call.reject("SHARE_FAILED", nil, error) }
                else { call.resolve(["completed": completed]) }
            }
            presenter.present(controller, animated: true)
        }
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.authenticationCall == nil else { call.reject("BUSY"); return }
            if GKLocalPlayer.local.isAuthenticated {
                self.resolveIdentity(call)
                return
            }
            self.authenticationCall = call
            let authenticationID = UUID()
            self.authenticationID = authenticationID
            DispatchQueue.main.asyncAfter(deadline: .now() + 60) { [weak self] in
                guard let self = self, self.authenticationID == authenticationID,
                      let pending = self.authenticationCall else { return }
                self.authenticationCall = nil
                self.authenticationID = nil
                pending.reject("AUTHENTICATION_TIMEOUT")
            }
            GKLocalPlayer.local.authenticateHandler = { [weak self] controller, error in
                DispatchQueue.main.async {
                    guard let self = self, self.authenticationID == authenticationID,
                          let pending = self.authenticationCall else { return }
                    if let controller = controller {
                        guard let presenter = self.bridge?.viewController,
                              presenter.presentedViewController == nil else {
                            self.authenticationCall = nil
                            self.authenticationID = nil
                            pending.reject("PRESENTATION_BUSY")
                            return
                        }
                        presenter.present(controller, animated: true)
                        return
                    }
                    self.authenticationCall = nil
                    self.authenticationID = nil
                    if GKLocalPlayer.local.isAuthenticated { self.resolveIdentity(pending) }
                    else { pending.reject("GAME_CENTER_NOT_AUTHENTICATED", nil, error) }
                }
            }
        }
    }

    private func resolveIdentity(_ call: CAPPluginCall) {
        call.resolve(["playerId": GKLocalPlayer.local.gamePlayerID, "alias": GKLocalPlayer.local.alias])
    }

    private func checkedBoard(_ call: CAPPluginCall) -> String? {
        guard GKLocalPlayer.local.isAuthenticated,
              call.getString("playerId") == GKLocalPlayer.local.gamePlayerID else {
            call.reject("GAME_CENTER_ACCOUNT_CHANGED")
            return nil
        }
        guard let id = call.getString("leaderboardId"), boardIDs.contains(id) else {
            call.reject("INVALID_BOARD")
            return nil
        }
        return id
    }

    @objc func submit(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let id = self.checkedBoard(call) else { return }
            guard let text = call.getString("score"), let score = Int(text),
                  score >= -9007199254740991, score <= 9007199254740991,
                  (id == "tradeup.profit100.v1" || score >= 0),
                  (id != "tradeup.homebudget.v1" || score > 0) else {
                call.reject("INVALID_SCORE")
                return
            }
            GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [id]) { error in
                if let error = error { call.reject("SCORE_SUBMISSION_FAILED", nil, error) }
                else { call.resolve() }
            }
        }
    }

    private func entry(_ entry: GKLeaderboard.Entry) -> [String: Any] {
        return ["rank": entry.rank, "alias": entry.player.alias,
                "score": String(entry.score), "isLocal": entry.player.gamePlayerID == GKLocalPlayer.local.gamePlayerID]
    }

    @objc func load(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let id = self.checkedBoard(call), let playerId = call.getString("playerId") else { return }
            GKLeaderboard.loadLeaderboards(IDs: [id]) { boards, error in
                guard let board = boards?.first, error == nil else {
                    call.reject("LEADERBOARD_UNAVAILABLE", nil, error)
                    return
                }
                board.loadEntries(for: .global, timeScope: .allTime, range: NSRange(location: 1, length: 100)) { local, entries, total, error in
                    guard GKLocalPlayer.local.isAuthenticated,
                          GKLocalPlayer.local.gamePlayerID == playerId else {
                        call.reject("GAME_CENTER_ACCOUNT_CHANGED")
                        return
                    }
                    if let error = error { call.reject("LEADERBOARD_UNAVAILABLE", nil, error); return }
                    var result: [String: Any] = ["entries": (entries ?? []).prefix(100).map { self.entry($0) }, "total": total]
                    if let local = local { result["local"] = self.entry(local) }
                    call.resolve(result)
                }
            }
        }
    }
}
